import { Routes, Route } from 'react-router-dom';
import UploadPage from './UploadPage';
import DocumentViewer from './DocumentViewer';
import SharedDocumentViewer from './SharedDocumentViewer';

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/doc/:id" element={<DocumentViewer />} />
      <Route path="/shared/:shareToken" element={<SharedDocumentViewer />} />
    </Routes>
  );
}