import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard, ServicesPage, ScenariosPage } from './pages/Dashboard';
import { ScenarioBuilder } from './pages/ScenarioBuilder';
import { RunHistory } from './pages/RunHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/synthetic" replace />} />
        
        {/* Projects list */}
        <Route path="/synthetic" element={<Dashboard />} />
        
        {/* Services for a project */}
        <Route path="/synthetic/:projectId" element={<ServicesPage />} />
        
        {/* Scenarios for a service */}
        <Route path="/synthetic/:projectId/services/:serviceId" element={<ScenariosPage />} />
        <Route path="/synthetic/:projectId/services/:serviceId/scenarios" element={<ScenariosPage />} />
        
        {/* Scenario editor */}
        <Route path="/synthetic/:projectId/services/:serviceId/scenarios/new" element={<ScenarioBuilder />} />
        <Route path="/synthetic/:projectId/services/:serviceId/scenarios/:id" element={<ScenarioBuilder />} />
        
        {/* Run history */}
        <Route path="/synthetic/:projectId/services/:serviceId/scenarios/:id/history" element={<RunHistory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;