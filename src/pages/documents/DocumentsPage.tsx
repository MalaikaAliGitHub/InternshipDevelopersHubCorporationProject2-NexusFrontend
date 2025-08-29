import React, { useRef, useState, useEffect } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000/api/documents';

type DocInfo = {
  id?: string;
  _id?: string;
  fileName: string;
  status: 'pending' | 'signed';
  fileUrl: string;
  signedUrl?: string | null;
};

export const DocumentsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'signed'>('idle');
  const [docs, setDocs] = useState<DocInfo[]>([]);

  const sigRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('token');

  const fetchDocs = async () => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await fetch(`${API_BASE}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDocs(data.documents);
    } catch (err) {
      console.error('Fetch documents error:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchDocs();
  }, [isAuthenticated]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !isAuthenticated) return;

    setUploading(true);
    setSelectedFileName(file.name);
    setSignedUrl(null);
    setStatus('idle');
    setFileUrl(null);
    setDocumentId(null);

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: form,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('Upload response:', data);

      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');

      setDocumentId(data.documentId);
      setFileUrl(`http://localhost:5000${data.fileUrl}`);
      setStatus('pending');

      await fetchDocs();
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message}`);
      setSelectedFileName(null);
      setStatus('idle');
    } finally {
      setUploading(false);
    }
  };

  const handleSign = async () => {
    if (!documentId || !sigRef.current || !token || !isAuthenticated) return;
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    if (!dataUrl) return;

    try {
      const res = await fetch(`${API_BASE}/sign/${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ signature: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Sign failed');

      setSignedUrl(`http://localhost:5000${data.fileUrl}`);
      setStatus('signed');
      setFileUrl(`http://localhost:5000${data.fileUrl}`); // update preview with signed file
      await fetchDocs();
    } catch (err) {
      console.error(err);
      alert('Signing failed. Please try again.');
    }
  };

  const clearSignature = () => sigRef.current?.clear();
  const isPdf = (url?: string | null) => (url || '').toLowerCase().endsWith('.pdf');
  const isImage = (url?: string | null) => /\.(png|jpg|jpeg|gif)$/i.test(url || '');

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Documents</h1>
        <p className="text-gray-600 mb-6">Please log in to upload and sign documents</p>
        <Button onClick={() => (window.location.href = '/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-gray-600">Upload, preview, and sign documents</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.docx"
          />
          <Button leftIcon={<Upload size={18} />} isLoading={uploading} onClick={openFilePicker}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium">Status</h2>
          </CardHeader>
          <CardBody className="space-y-2">
            {selectedFileName ? (
              <>
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>{selectedFileName}</span>
                </div>
                <Badge variant={status === 'signed' ? 'success' : status === 'pending' ? 'secondary' : 'default'}>
                  {status}
                </Badge>
              </>
            ) : (
              <div>Select a file to begin</div>
            )}
          </CardBody>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium">Preview</h2>
            </CardHeader>
            <CardBody>
              {fileUrl ? (
                isPdf(fileUrl) ? (
                  <iframe src={fileUrl} className="w-full h-[500px] border rounded" />
                ) : isImage(fileUrl) ? (
                  <img src={fileUrl} alt="uploaded" className="max-h-[500px] rounded border" />
                ) : (
                  <div>Preview not supported</div>
                )
              ) : (
                <div>No file selected</div>
              )}
            </CardBody>
          </Card>

          {/* Signature */}
          {fileUrl && status === 'pending' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">Signature</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="border p-2 inline-block">
                  <SignatureCanvas
                    ref={sigRef}
                    penColor="black"
                    canvasProps={{ width: 400, height: 150, className: 'bg-white rounded' }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearSignature}>
                    Clear
                  </Button>
                  <Button onClick={handleSign} disabled={!documentId}>
                    Apply Signature
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* My Documents */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium">My Documents</h2>
            </CardHeader>
            <CardBody>
              {docs.length === 0 ? (
                <div>No documents yet.</div>
              ) : (
                docs.map(d => (
                  <div key={d._id || d.id} className="flex justify-between items-center border rounded p-2">
                    <div className="flex gap-2 items-center">
                      <span>{d.fileName}</span>
                      <Badge variant={d.status === 'signed' ? 'success' : 'secondary'}>{d.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <a href={`http://localhost:5000${d.fileUrl}`} target="_blank" rel="noreferrer">
                        View
                      </a>
                      {d.signedUrl && (
                        <a href={`http://localhost:5000${d.signedUrl}`} target="_blank" rel="noreferrer">
                          Download signed
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
