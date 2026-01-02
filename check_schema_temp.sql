SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'notification_stats';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'announcement_views';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'announcement_clicks';
