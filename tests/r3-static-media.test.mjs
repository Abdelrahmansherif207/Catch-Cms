import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';

let server;
let validateSectionMedia;
let selectSectionMediaFile;
let selectSectionRemoveMedia;
let extractSectionServerErrors;
let toCreateSectionPayload;
let toUpdateSectionPayload;
let SECTION_IMAGE_MAX_BYTES;
let SECTION_VIDEO_MAX_BYTES;

const IMAGE_MEDIA = {
  id: 11,
  url: '/media/team.png',
  thumb_url: '/media/team-thumb.png',
  collection_name: 'static-section-image',
  mime_type: 'image/png',
  size: 2048,
};

const VIDEO_MEDIA = {
  id: 12,
  url: '/media/demo.mp4',
  thumb_url: null,
  collection_name: 'static-section-video',
  mime_type: 'video/mp4',
  size: 4096,
};

before(async () => {
  server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true },
  });

  ({
    validateSectionMedia,
    selectSectionMediaFile,
    selectSectionRemoveMedia,
    extractSectionServerErrors,
    toCreateSectionPayload,
    toUpdateSectionPayload,
    SECTION_IMAGE_MAX_BYTES,
    SECTION_VIDEO_MAX_BYTES,
  } = await server.ssrLoadModule(
    '/src/features/static-pages/schemas/static-page.schema.ts'
  ));
});

after(async () => {
  await server?.close();
});

function makeFile(name = 'replacement.png', type = 'image/png', bytes = 4) {
  return new File([new Uint8Array(bytes)], name, { type });
}

function mediaInput(overrides = {}) {
  return {
    isEditing: false,
    type: 'image',
    mediaFile: null,
    removeMedia: false,
    originalType: undefined,
    existingMedia: null,
    maxBytes: SECTION_IMAGE_MAX_BYTES,
    ...overrides,
  };
}

function sectionValues(type) {
  return {
    titleEn: 'Section',
    titleAr: 'قسم',
    type,
    isActive: true,
    configText: '',
  };
}

function updatePayload(extra, originalType = 'image') {
  return toUpdateSectionPayload(
    sectionValues('image'),
    { en: {}, ar: {} },
    {},
    { type: originalType, config: null, is_active: true },
    extra
  );
}

// ─── Truth table: create ─────────────────────────────────────────

test('creating an image, video or screenshot section requires a file', () => {
  for (const type of ['image', 'video', 'screenshot']) {
    assert.equal(
      validateSectionMedia(mediaInput({ type })),
      'staticPages.validation.mediaRequired',
      `${type} should require media on create`
    );
  }
});

test('creating a media section with a file is valid', () => {
  for (const type of ['image', 'video', 'screenshot']) {
    assert.equal(
      validateSectionMedia(
        mediaInput({
          type,
          mediaFile: makeFile(),
          maxBytes: type === 'video' ? SECTION_VIDEO_MAX_BYTES : SECTION_IMAGE_MAX_BYTES,
        })
      ),
      null,
      `${type} should accept a replacement file`
    );
  }
});

test('creating a text section needs no file and rejects one', () => {
  assert.equal(validateSectionMedia(mediaInput({ type: 'text' })), null);
  assert.equal(
    validateSectionMedia(mediaInput({ type: 'text', mediaFile: makeFile() })),
    'staticPages.validation.mediaProhibited'
  );
});

// ─── Truth table: editing, unchanged type ────────────────────────

test('editing a media section without type change preserves existing media', () => {
  for (const [type, media] of [
    ['image', IMAGE_MEDIA],
    ['screenshot', IMAGE_MEDIA],
    ['video', VIDEO_MEDIA],
  ]) {
    assert.equal(
      validateSectionMedia(
        mediaInput({
          isEditing: true,
          type,
          originalType: type,
          existingMedia: media,
          removeMedia: false,
          maxBytes: type === 'video' ? SECTION_VIDEO_MAX_BYTES : SECTION_IMAGE_MAX_BYTES,
        })
      ),
      null,
      `${type} should keep its existing media`
    );
  }
});

test('remove-media allows submission without a replacement file', () => {
  for (const [type, media] of [
    ['image', IMAGE_MEDIA],
    ['screenshot', IMAGE_MEDIA],
    ['video', VIDEO_MEDIA],
  ]) {
    assert.equal(
      validateSectionMedia(
        mediaInput({
          isEditing: true,
          type,
          originalType: type,
          existingMedia: media,
          removeMedia: true,
          maxBytes: type === 'video' ? SECTION_VIDEO_MAX_BYTES : SECTION_IMAGE_MAX_BYTES,
        })
      ),
      null,
      `${type} should allow explicit removal`
    );
  }
});

test('editing a media section with no existing media still requires a file', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'image',
        originalType: 'image',
        existingMedia: null,
        removeMedia: false,
      })
    ),
    'staticPages.validation.mediaRequired'
  );
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'image',
        originalType: 'image',
        existingMedia: null,
        removeMedia: true,
      })
    ),
    'staticPages.validation.mediaRequired',
    'remove-media cannot satisfy a missing media requirement'
  );
});

test('editing a media section with a replacement file is valid', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'image',
        originalType: 'image',
        existingMedia: IMAGE_MEDIA,
        mediaFile: makeFile(),
      })
    ),
    null
  );
});

test('rejects a replacement file above the per-type size limit', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'image',
        originalType: 'image',
        existingMedia: IMAGE_MEDIA,
        mediaFile: { size: SECTION_IMAGE_MAX_BYTES + 1 },
      })
    ),
    'staticPages.validation.mediaTooLarge'
  );
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'video',
        originalType: 'video',
        existingMedia: VIDEO_MEDIA,
        mediaFile: { size: SECTION_VIDEO_MAX_BYTES + 1 },
        maxBytes: SECTION_VIDEO_MAX_BYTES,
      })
    ),
    'staticPages.validation.mediaTooLarge'
  );
});

test('accepts a replacement file exactly at the size limit', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'image',
        originalType: 'image',
        existingMedia: IMAGE_MEDIA,
        mediaFile: { size: SECTION_IMAGE_MAX_BYTES },
      })
    ),
    null
  );
});

// ─── Truth table: type switches ─────────────────────────────────

test('switching to another media type requires a replacement file', () => {
  const switches = [
    ['image', 'video'],
    ['image', 'screenshot'],
    ['video', 'image'],
    ['video', 'screenshot'],
    ['screenshot', 'image'],
    ['screenshot', 'video'],
  ];

  for (const [from, to] of switches) {
    assert.equal(
      validateSectionMedia(
        mediaInput({
          isEditing: true,
          type: to,
          originalType: from,
          existingMedia: from === 'video' ? VIDEO_MEDIA : IMAGE_MEDIA,
          removeMedia: false,
          maxBytes: to === 'video' ? SECTION_VIDEO_MAX_BYTES : SECTION_IMAGE_MAX_BYTES,
        })
      ),
      'staticPages.validation.mediaRequired',
      `${from} → ${to} should require a replacement file`
    );
  }
});

test('remove-media cannot bypass the media-type switch requirement', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'video',
        originalType: 'image',
        existingMedia: IMAGE_MEDIA,
        removeMedia: true,
        maxBytes: SECTION_VIDEO_MAX_BYTES,
      })
    ),
    'staticPages.validation.mediaRequired'
  );
});

test('switching media types with a replacement file is valid', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'video',
        originalType: 'image',
        existingMedia: IMAGE_MEDIA,
        mediaFile: makeFile('clip.mp4', 'video/mp4'),
        maxBytes: SECTION_VIDEO_MAX_BYTES,
      })
    ),
    null
  );
});

test('media to text is allowed without a replacement file', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'text',
        originalType: 'image',
        existingMedia: IMAGE_MEDIA,
      })
    ),
    null
  );
});

test('media to text rejects a leftover media file', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'text',
        originalType: 'image',
        existingMedia: IMAGE_MEDIA,
        mediaFile: makeFile(),
      })
    ),
    'staticPages.validation.mediaProhibited'
  );
});

test('text to media requires a file', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'image',
        originalType: 'text',
        existingMedia: null,
      })
    ),
    'staticPages.validation.mediaRequired'
  );
  assert.equal(
    validateSectionMedia(
      mediaInput({
        isEditing: true,
        type: 'image',
        originalType: 'text',
        existingMedia: null,
        mediaFile: makeFile(),
      })
    ),
    null
  );
});

test('editing a text section and staying text needs no file', () => {
  assert.equal(
    validateSectionMedia(
      mediaInput({ isEditing: true, type: 'text', originalType: 'text' })
    ),
    null
  );
});

// ─── Selection state transitions ────────────────────────────────

test('selecting a replacement file clears remove-media state', () => {
  const replacement = makeFile();
  assert.deepEqual(selectSectionMediaFile(replacement), {
    mediaFile: replacement,
    removeMedia: false,
  });
  assert.deepEqual(selectSectionMediaFile(replacement, true), {
    mediaFile: replacement,
    removeMedia: false,
  });
});

test('cancelling the file picker keeps remove-media state', () => {
  assert.deepEqual(selectSectionMediaFile(null, true), {
    mediaFile: null,
    removeMedia: true,
  });
});

test('selecting remove-media clears the selected file and preview', () => {
  assert.deepEqual(selectSectionRemoveMedia(true), {
    mediaFile: null,
    removeMedia: true,
  });
  assert.deepEqual(selectSectionRemoveMedia(false), {
    mediaFile: null,
    removeMedia: false,
  });
});

// ─── Payload flags ──────────────────────────────────────────────

test('replacement update sends media and no remove_media', () => {
  const replacement = makeFile();
  const payload = updatePayload({ media: replacement });

  assert.equal(payload.media, replacement);
  assert.equal('remove_media' in payload, false);
});

test('removal update sends remove_media and no replacement file', () => {
  const payload = updatePayload({ removeMedia: true });

  assert.equal(payload.remove_media, true);
  assert.equal('media' in payload, false);
});

test('a replacement file always wins over remove_media', () => {
  const replacement = makeFile();
  const payload = updatePayload({ media: replacement, removeMedia: true });

  assert.equal(payload.media, replacement);
  assert.equal('remove_media' in payload, false);
});

test('unchanged media sends neither media nor remove_media', () => {
  const payload = updatePayload({});

  assert.equal('media' in payload, false);
  assert.equal('remove_media' in payload, false);
});

test('create payload includes a media file when one is selected', () => {
  const replacement = makeFile();
  const withFile = toCreateSectionPayload(sectionValues('image'), { en: {}, ar: {} }, {
    media: replacement,
  });
  const withoutFile = toCreateSectionPayload(sectionValues('image'), { en: {}, ar: {} });

  assert.equal(withFile.media, replacement);
  assert.equal('media' in withoutFile, false);
});

// ─── 422 server-error mapping ──────────────────────────────────

test('maps 422 media, config and remove_media errors for display', () => {
  const state = extractSectionServerErrors({
    status: 422,
    message: 'Validation failed',
    success: false,
    errors: {
      media: ['The media field is required.'],
      config: ['The config must be an object.'],
      remove_media: ['The remove media field is invalid.'],
      title: ['The title field is required.'],
    },
  });

  assert.equal(state.mediaError, 'The media field is required.');
  assert.equal(state.configError, 'The config must be an object.');
  assert.deepEqual(state.serverErrors.remove_media, [
    'The remove media field is invalid.',
  ]);
  assert.deepEqual(state.serverErrors.title, ['The title field is required.']);
});

test('ignores non-422 errors and 422 responses without field errors', () => {
  const empty = { serverErrors: {}, mediaError: null, configError: null };

  assert.deepEqual(
    extractSectionServerErrors({
      status: 500,
      message: 'Server error',
      success: false,
      errors: { media: ['ignored'] },
    }),
    empty
  );
  assert.deepEqual(
    extractSectionServerErrors({
      status: 422,
      message: 'Validation failed',
      success: false,
    }),
    empty
  );
  assert.deepEqual(extractSectionServerErrors(undefined), empty);
});

test('422 errors without media or config leave those fields empty', () => {
  const state = extractSectionServerErrors({
    status: 422,
    message: 'Validation failed',
    success: false,
    errors: {
      remove_media: ['Cannot remove this media.'],
      media: [],
    },
  });

  assert.equal(state.mediaError, null);
  assert.equal(state.configError, null);
  assert.deepEqual(state.serverErrors.remove_media, ['Cannot remove this media.']);
});
