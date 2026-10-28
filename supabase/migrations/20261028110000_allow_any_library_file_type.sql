-- Accept uploads with any browser-reported MIME type in the private code library.
update storage.buckets
set allowed_mime_types = null
where id = 'programming-files';