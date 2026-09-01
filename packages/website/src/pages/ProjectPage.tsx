import { Link } from 'react-router';
import { useProject } from '../hooks/useProject.js';
import { PageNotFound } from '../components/PageNotFound.js';

export const ProjectPage: React.FC = () => {
  const project = useProject();

  if (project.notFound) return <PageNotFound />;

  return (
    <>
      <Link to="/">Go home</Link>
      <pre>{JSON.stringify(project)}</pre>
    </>
  );
};
