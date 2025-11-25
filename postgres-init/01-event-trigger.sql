-- Function that sends a NOTIFY JSON payload when new event is inserted
-- not compatible nowwwww

CREATE OR REPLACE FUNCTION notify_new_event() RETURNS trigger AS $$
DECLARE
    payload JSON;
BEGIN
    payload = json_build_object(
        'type', 'new_event',
        'event_id', NEW.id,
        'timestamp', NOW()
    );
    PERFORM pg_notify('events_channel', payload::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Drop & recreate the trigger to avoid duplication
DROP TRIGGER IF EXISTS event_insert_trigger ON event;

CREATE TRIGGER event_insert_trigger
AFTER INSERT ON event
FOR EACH ROW
EXECUTE FUNCTION notify_new_event();
