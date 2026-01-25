'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText } from 'lucide-react';
import type { BookingDocument } from '@/lib/types/document';

interface DocumentsListProps {
  documents: BookingDocument[];
  onDelete?: (documentId: string) => Promise<void>;
  onDownload?: (document: BookingDocument) => Promise<void>;
  canDelete?: boolean;
}

export default function DocumentsList({ documents, onDelete, onDownload, canDelete = false }: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents uploaded yet
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </TableCell>
              <TableCell className="font-medium">{doc.file_name}</TableCell>
              <TableCell>{formatType(doc.document_type)}</TableCell>
              <TableCell>{formatSize(doc.file_size)}</TableCell>
              <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
              <TableCell className="max-w-xs truncate">{doc.notes || '-'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {onDownload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
