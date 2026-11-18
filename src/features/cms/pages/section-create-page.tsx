import { useNavigate } from 'react-router';
import { SectionFormContent } from '../components/section-form-content';

/** Full-page section editor for creating a new section (`/cms/new`). */
export function SectionCreatePage() {
  const navigate = useNavigate();

  return (
    <SectionFormContent
      onSuccess={() => navigate('/cms')}
      onCancel={() => navigate('/cms')}
    />
  );
}
