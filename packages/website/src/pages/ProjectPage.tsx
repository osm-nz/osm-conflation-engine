import { Link } from 'react-router';
import { useProject } from '../hooks/useProject.js';

export const ProjectPage: React.FC = () => {
  const project = useProject();

  return (
    <>
      <Link to="/">Go home</Link>
      {project.project ? (
        <pre>{JSON.stringify(project)}</pre>
      ) : (
        'Invalid project'
      )}
    </>
  );
};
