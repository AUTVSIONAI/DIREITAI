
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename IN ('users', 'blog_post_likes', 'politician_ratings');

SELECT
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM
    pg_constraint c
JOIN
    pg_namespace n ON n.oid = c.connamespace
WHERE
    n.nspname = 'public'
    AND c.conrelid::regclass::text IN ('public.blog_post_likes', 'public.politician_ratings');
