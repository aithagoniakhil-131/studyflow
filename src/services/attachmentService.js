import { localAttachmentDb } from './localAttachmentDb';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB limit

export const attachmentService = {
  // Get detailed attachment by ID
  get: async (id) => {
    return localAttachmentDb.attachments.get(id);
  },

  // List all attachments for a user
  list: async (userId) => {
    return localAttachmentDb.attachments.list(userId);
  },

  // Save a local File or Blob into IndexedDB
  createFile: async (userId, file) => {
    if (!file) {
      throw new Error('No file provided.');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File "${file.name}" exceeds the 20MB storage limit.`);
    }

    const payload = {
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      file_blob: file,
      source_type: 'file',
      source_url: ''
    };

    return localAttachmentDb.attachments.create(userId, payload);
  },

  // Save an external URL (Google Drive, YouTube, Web link)
  createUrl: async (userId, title, url, type = 'website') => {
    if (!title || !title.trim()) {
      throw new Error('Link title is required.');
    }
    if (!url || !url.trim()) {
      throw new Error('URL is required.');
    }

    const payload = {
      file_name: title.trim(),
      mime_type: 'text/html',
      size_bytes: 0,
      file_blob: null,
      source_type: 'url',
      source_url: url.trim()
    };

    return localAttachmentDb.attachments.create(userId, payload);
  },

  // Link an existing attachment to an entity (e.g. 'task', 'exam', 'resource')
  link: async (attachmentId, entityType, entityId) => {
    return localAttachmentDb.attachmentLinks.link(attachmentId, entityType, entityId);
  },

  // Unlink an attachment from an entity. If no other references exist, garbage collect the file.
  unlink: async (attachmentId, entityType, entityId) => {
    // 1. Remove the link row
    await localAttachmentDb.attachmentLinks.unlink(attachmentId, entityType, entityId);
    
    // 2. Count references remaining for this attachment
    const remainingLinks = await localAttachmentDb.attachmentLinks.listForAttachment(attachmentId);
    if (remainingLinks.length === 0) {
      // 3. If zero remaining links, delete the file blob from IndexedDB to free space
      await localAttachmentDb.attachments.delete(attachmentId);
    }
    return true;
  },

  // List all attachments linked to a specific entity
  listForEntity: async (entityType, entityId) => {
    const links = await localAttachmentDb.attachmentLinks.listForEntity(entityType, entityId);
    const attachments = await Promise.all(
      links.map(link => localAttachmentDb.attachments.get(link.attachment_id))
    );
    // Filter out any that returned null (due to deletion inconsistency)
    return attachments.filter(Boolean);
  }
};
