import api from './api';

export const conversationApi = {
  list: (params = {}) =>
    api.get('/conversations', {
      params: {
        limit: params.limit || 30,
        before_last_message_at: params.before_last_message_at || undefined,
      },
    }),

  getMessages: (conversationId, params = {}) =>
    api.get(`/conversations/${conversationId}/messages`, {
      params: {
        limit: params.limit || 40,
        before_id: params.before_id || undefined,
        before_created_at: params.before_created_at || undefined,
      },
    }),

  getExport: (conversationId, messageId) =>
    api.get(`/conversations/${conversationId}/messages/${messageId}/export`),

  /**
   * Stream xlsx through API with Authorization (blob).
   * Avoids browser→MinIO presigned URL SignatureDoesNotMatch.
   */
  downloadExportFile: async (conversationId, messageId, fileName = 'export.xlsx') => {
    const res = await api.get(
      `/conversations/${conversationId}/messages/${messageId}/export/file`,
      { responseType: 'blob' }
    );
    const blob = res.data;
    // If server returned JSON error as blob, surface it
    if (blob.type && blob.type.includes('application/json')) {
      const text = await blob.text();
      let detail = text;
      try {
        detail = JSON.parse(text)?.detail || text;
      } catch (_) {}
      const err = new Error(
        typeof detail === 'string' ? detail : detail?.message || 'دانلود ناموفق'
      );
      err.code = detail?.code || 'download_failed';
      throw err;
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'export.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * setReaction(convId, msgId, { reaction, comment })
   * or setReaction(convId, msgId, reactionBool, comment)
   */
  setReaction: (conversationId, messageId, reactionOrBody, comment = null) => {
    const body =
      reactionOrBody !== null &&
      typeof reactionOrBody === 'object' &&
      !Array.isArray(reactionOrBody)
        ? {
            reaction: !!reactionOrBody.reaction,
            comment: reactionOrBody.comment ?? null,
          }
        : { reaction: !!reactionOrBody, comment: comment ?? null };
    return api.post(
      `/conversations/${conversationId}/messages/${messageId}/reaction`,
      body
    );
  },
};

export async function fetchMessageExport(conversationId, messageId) {
  try {
    const res = await conversationApi.getExport(conversationId, messageId);
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const detail = err?.response?.data?.detail;
    if (status === 404 || status === 410 || detail?.code === 'file_expired') {
      const e = new Error(
        detail?.message ||
          'این فایل دیگر در دسترس نیست. لطفاً دوباره سوال را بپرسید.'
      );
      e.code = 'file_expired';
      e.status = status;
      throw e;
    }
    throw err;
  }
}

export default conversationApi;