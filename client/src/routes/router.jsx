import { createBrowserRouter } from 'react-router-dom';
import HealthCheck from '../pages/HealthCheck.jsx';

// Routes are expanded as features are built (auth, dashboard, projects, ...).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HealthCheck />,
  },
]);
