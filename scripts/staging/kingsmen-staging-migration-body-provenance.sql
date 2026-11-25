-- Kingsmen staging migration-body provenance capture.
-- READ-ONLY: this query retrieves migration metadata and computes Git blob
-- SHA-1 fingerprints from the recorded SQL statement bytes.
--
-- Target project must be independently confirmed as:
--   euhubhhnumtibbyufghm (kingsmen-portal-staging)
--
-- The query does not apply migrations, inspect candidate rows, alter schema,
-- change grants/policies/Auth, or modify release gates.
--
-- Git blob SHA format:
--   SHA1(UTF8("blob " || byte_length || NUL) || UTF8(statement))
--
-- A matching hash proves byte-for-byte body identity with a tracked Git blob.
-- It does not by itself prove the deployment commit, migration approval,
-- schema compatibility, or authorize replay.

SELECT
  version,
  name,
  cardinality(statements) AS statement_count,
  CASE
    WHEN cardinality(statements) = 1
    THEN octet_length(convert_to(statements[1], 'UTF8'))
    ELSE NULL
  END AS statement_bytes,
  CASE
    WHEN cardinality(statements) = 1
    THEN encode(
      digest(
        decode('626c6f6220', 'hex')
        || convert_to(
          octet_length(convert_to(statements[1], 'UTF8'))::text,
          'UTF8'
        )
        || decode('00', 'hex')
        || convert_to(statements[1], 'UTF8'),
        'sha1'
      ),
      'hex'
    )
    ELSE NULL
  END AS git_blob_sha
FROM supabase_migrations.schema_migrations
ORDER BY version;
