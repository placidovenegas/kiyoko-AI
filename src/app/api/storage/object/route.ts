import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
} from '@/lib/observability/server';
import { createClient } from '@/lib/supabase/server';

interface DeleteObjectBody {
  bucket: string;
  path: string;
}

function normalizeBucket(bucket: string) {
  const trimmed = bucket.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(trimmed) ? trimmed : null;
}

function normalizeObjectPath(path: string) {
  const sanitized = path
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/');

  if (!sanitized || sanitized.includes('..')) {
    return null;
  }

  return sanitized;
}

export async function POST(request: Request) {
  const requestContext = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const formData = await request.formData();
    const bucket = normalizeBucket(String(formData.get('bucket') ?? ''));
    const path = normalizeObjectPath(String(formData.get('path') ?? ''));
    const file = formData.get('file');

    if (!bucket) {
      return apiBadRequest(requestContext, 'Invalid bucket');
    }

    if (!path) {
      return apiBadRequest(requestContext, 'Invalid path');
    }

    if (!(file instanceof File)) {
      return apiBadRequest(requestContext, 'Missing file');
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      return apiError(requestContext, 'storage/object', uploadError, {
        status: 500,
        message: 'Failed to upload file',
        extra: {
          bucket,
          path,
          userId: user.id,
          fileName: file.name,
          fileSize: file.size,
        },
        exposeDetails: true,
      });
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

    logServerEvent('storage/object', requestContext, 'Uploaded storage object', {
      bucket,
      path,
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
    });

    return apiJson(requestContext, {
      success: true,
      requestId: requestContext.requestId,
      file: {
        id: path,
        url: publicUrlData.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    return apiError(requestContext, 'storage/object', error, {
      message: 'Unexpected storage upload error',
    });
  }
}

export async function DELETE(request: Request) {
  const requestContext = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const body = (await request.json()) as DeleteObjectBody;
    const bucket = normalizeBucket(body?.bucket ?? '');
    const path = normalizeObjectPath(body?.path ?? '');

    if (!bucket) {
      return apiBadRequest(requestContext, 'Invalid bucket');
    }

    if (!path) {
      return apiBadRequest(requestContext, 'Invalid path');
    }

    const { error: removeError } = await supabase.storage.from(bucket).remove([path]);

    if (removeError) {
      return apiError(requestContext, 'storage/object', removeError, {
        status: 500,
        message: 'Failed to delete file',
        extra: { bucket, path, userId: user.id },
        exposeDetails: true,
      });
    }

    logServerEvent('storage/object', requestContext, 'Deleted storage object', {
      bucket,
      path,
      userId: user.id,
    });

    return apiJson(requestContext, {
      success: true,
      requestId: requestContext.requestId,
    });
  } catch (error) {
    return apiError(requestContext, 'storage/object', error, {
      message: 'Unexpected storage delete error',
    });
  }
}