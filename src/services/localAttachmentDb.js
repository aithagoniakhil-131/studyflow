// IndexedDB Local Storage Driver for Attachments
const DB_NAME = 'studyflow_attachments_db';
const DB_VERSION = 1;

const getDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('attachments')) {
        db.createObjectStore('attachments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('attachment_links')) {
        db.createObjectStore('attachment_links', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const localAttachmentDb = {
  attachments: {
    get: async (id) => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('attachments', 'readonly');
        const store = transaction.objectStore('attachments');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    },

    list: async (userId) => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('attachments', 'readonly');
        const store = transaction.objectStore('attachments');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const all = request.result || [];
          resolve(all.filter(a => a.user_id === userId));
        };
        request.onerror = () => reject(request.error);
      });
    },

    create: async (userId, data) => {
      const db = await getDB();
      const newAttachment = {
        id: crypto.randomUUID(),
        user_id: userId,
        file_name: data.file_name || 'Unnamed Attachment',
        mime_type: data.mime_type || 'application/octet-stream',
        size_bytes: Number(data.size_bytes) || 0,
        file_blob: data.file_blob || null, // Stores actual binary Blob
        source_type: data.source_type || 'file', // 'file' or 'url'
        source_url: data.source_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction('attachments', 'readwrite');
        const store = transaction.objectStore('attachments');
        const request = store.put(newAttachment);
        
        request.onsuccess = () => resolve(newAttachment);
        request.onerror = () => reject(request.error);
      });
    },

    delete: async (id) => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('attachments', 'readwrite');
        const store = transaction.objectStore('attachments');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
  },

  attachmentLinks: {
    listForEntity: async (entityType, entityId) => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('attachment_links', 'readonly');
        const store = transaction.objectStore('attachment_links');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const all = request.result || [];
          resolve(all.filter(link => link.entity_type === entityType && link.entity_id === entityId));
        };
        request.onerror = () => reject(request.error);
      });
    },

    listForAttachment: async (attachmentId) => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('attachment_links', 'readonly');
        const store = transaction.objectStore('attachment_links');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const all = request.result || [];
          resolve(all.filter(link => link.attachment_id === attachmentId));
        };
        request.onerror = () => reject(request.error);
      });
    },

    link: async (attachmentId, entityType, entityId) => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('attachment_links', 'readwrite');
        const store = transaction.objectStore('attachment_links');
        
        // Check duplication
        const checkRequest = store.getAll();
        checkRequest.onsuccess = () => {
          const all = checkRequest.result || [];
          const exists = all.some(link => 
            link.attachment_id === attachmentId && 
            link.entity_type === entityType && 
            link.entity_id === entityId
          );
          
          if (exists) {
            resolve(true);
            return;
          }

          const newLink = {
            id: crypto.randomUUID(),
            attachment_id: attachmentId,
            entity_type: entityType,
            entity_id: entityId,
            created_at: new Date().toISOString()
          };

          const addRequest = store.put(newLink);
          addRequest.onsuccess = () => resolve(newLink);
          addRequest.onerror = () => reject(addRequest.error);
        };
        checkRequest.onerror = () => reject(checkRequest.error);
      });
    },

    unlink: async (attachmentId, entityType, entityId) => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('attachment_links', 'readwrite');
        const store = transaction.objectStore('attachment_links');
        
        const request = store.getAll();
        request.onsuccess = () => {
          const all = request.result || [];
          const target = all.find(link => 
            link.attachment_id === attachmentId && 
            link.entity_type === entityType && 
            link.entity_id === entityId
          );

          if (!target) {
            resolve(true);
            return;
          }

          const delRequest = store.delete(target.id);
          delRequest.onsuccess = () => resolve(true);
          delRequest.onerror = () => reject(delRequest.error);
        };
        request.onerror = () => reject(request.error);
      });
    }
  }
};
