import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/testdx?authSource=admin';

const defaultSpanLimits = {
  maxNumberOfAttributes: 1000,
  maxNumberOfAttributesPerSpan: 128,
  maxNumberOfEvents: 100,
  maxNumberOfLinks: 100,
  maxNumberOfAttributesPerEvent: 32,
  maxNumberOfAttributesPerLink: 32,
  maxAttributeValueLength: 4096,
};

const defaultBatchConfig = {
  maxQueueSize: 2048,
  maxExportBatchSize: 512,
  exportTimeout: 30000,
  scheduledDelay: 5000,
};

const defaultSimpleConfig = {
  exportTimeout: 30000,
};

async function cleanCorruptedServices() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name).join(', '));

  // Find services with corrupted spanLimits
  const corruptedThreshold = 1000000;

  const services = await db.collection('services').find({
    'otelSdkConfig.trace.spanLimits.maxNumberOfAttributes': { $gt: corruptedThreshold }
  }).toArray();

  console.log(`Found ${services.length} services with corrupted spanLimits`);

  if (services.length === 0) {
    console.log('No corrupted services found');
    await mongoose.connection.close();
    return;
  }

  // Reset corrupted spanLimits to defaults
  const result = await db.collection('services').updateMany(
    {
      'otelSdkConfig.trace.spanLimits.maxNumberOfAttributes': { $gt: corruptedThreshold }
    },
    {
      $set: {
        'otelSdkConfig.trace.spanLimits': defaultSpanLimits,
        'otelSdkConfig.trace.batchConfig': defaultBatchConfig,
        'otelSdkConfig.trace.simpleConfig': defaultSimpleConfig,
      }
    }
  );

  console.log(`Updated ${result.modifiedCount} services`);

  // Also clean any batchConfig that might be corrupted
  const batchCorrupted = await db.collection('services').find({
    'otelSdkConfig.trace.batchConfig.maxQueueSize': { $gt: 100000 }
  }).toArray();

  console.log(`Found ${batchCorrupted.length} services with corrupted batchConfig`);

  if (batchCorrupted.length > 0) {
    const batchResult = await db.collection('services').updateMany(
      {
        'otelSdkConfig.trace.batchConfig.maxQueueSize': { $gt: 100000 }
      },
      {
        $set: {
          'otelSdkConfig.trace.batchConfig': defaultBatchConfig,
        }
      }
    );
    console.log(`Updated ${batchResult.modifiedCount} services with corrupted batchConfig`);
  }

  // Verify the fix
  const verified = await db.collection('services').find({
    'otelSdkConfig.trace.spanLimits.maxNumberOfAttributes': { $gt: corruptedThreshold }
  }).toArray();

  console.log(`Verified: ${verified.length} services still have corrupted data`);

  if (verified.length === 0) {
    console.log('All corrupted services have been cleaned!');
  } else {
    console.log('WARNING: Some services still have corrupted data');
  }

  await mongoose.connection.close();
  console.log('Disconnected from MongoDB');
}

cleanCorruptedServices().catch(err => {
  console.error('Error cleaning services:', err);
  process.exit(1);
});