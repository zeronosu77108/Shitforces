ALTER TABLE accountinfo ADD COLUMN loginFailCount INT NOT NULL DEFAULT 0;
ALTER TABLE accountinfo ADD COLUMN lockDateTime TIMESTAMP NOT NULL DEFAULT to_timestamp(0);