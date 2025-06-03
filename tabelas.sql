CREATE UNLOGGED TABLE clientes_em_memoria (
  id SERIAL PRIMARY KEY,
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



