CREATE UNLOGGED TABLE clientes_em_memoria (
  id INT PRIMARY KEY,
  nome TEXT,
  saldo NUMERIC
);

CREATE TABLE log (
  log_id SERIAL PRIMARY KEY,
  operacao TEXT,
  id_cliente INT,
  nome TEXT,
  saldo NUMERIC
);

CREATE OR REPLACE FUNCTION trigger_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO log (operacao, id_cliente, nome, saldo)
        VALUES ('INSERT', NEW.id, NEW.nome, NEW.saldo);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO log (operacao, id_cliente, nome, saldo)
        VALUES ('UPDATE', NEW.id, NEW.nome, NEW.saldo);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO log (operacao, id_cliente, nome, saldo)
        VALUES ('DELETE', OLD.id, NULL, NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clientes_em_memoria_after_insert
AFTER INSERT ON clientes_em_memoria
FOR EACH ROW EXECUTE FUNCTION trigger_log();

CREATE TRIGGER trg_clientes_em_memoria_after_update
AFTER UPDATE ON clientes_em_memoria
FOR EACH ROW EXECUTE FUNCTION trigger_log();

CREATE TRIGGER trg_clientes_em_memoria_after_delete
AFTER DELETE ON clientes_em_memoria
FOR EACH ROW EXECUTE FUNCTION trigger_log();

BEGIN;
INSERT INTO clientes_em_memoria (id, nome, saldo) VALUES (1, 'Cliente 1', 100.00);
UPDATE clientes_em_memoria SET saldo = saldo + 50 WHERE id = 1;
END;

BEGIN;
INSERT INTO clientes_em_memoria (id, nome, saldo) VALUES (2, 'Cliente 2', 200.00);
UPDATE clientes_em_memoria SET saldo = saldo + 50 WHERE id = 2;
END;

BEGIN;
INSERT INTO clientes_em_memoria (id, nome, saldo) VALUES (3, 'Cliente 3', 300.00);
UPDATE clientes_em_memoria SET saldo = saldo + 50 WHERE id = 2;
END;

BEGIN;
INSERT INTO clientes_em_memoria (id, nome, saldo) VALUES (4, 'Cliente 4', 400.00);
UPDATE clientes_em_memoria SET saldo = saldo + 50 WHERE id = 3;
END;

BEGIN;
INSERT INTO clientes_em_memoria (id, nome, saldo) VALUES (5, 'Cliente 5', 500.00);
END;

BEGIN;
UPDATE clientes_em_memoria SET saldo = 550.00 WHERE id = 5;
END;

BEGIN;
DELETE FROM clientes_em_memoria WHERE id = 5;
END;

BEGIN;
INSERT INTO clientes_em_memoria (id, nome, saldo) VALUES (6, 'Cliente 6', 600.00);
END;