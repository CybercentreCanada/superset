# Vault CA container import
ARG VAULT_CA_CONTAINER=uchimera.azurecr.io/cccs/hogwarts/vault-ca:master_11376_a25c34e1
FROM $VAULT_CA_CONTAINER AS vault_ca
FROM uchimera.azurecr.io/cccs/superset-base:cccs-4.1_20250410211423_b12265

USER root

COPY *requirements.txt /tmp/

ARG BUILD_NUMBER=0-development

# Copy Vault CA certs
COPY --from=vault_ca /usr/local/share/ca-certificates/ /usr/local/share/ca-certificates/
RUN python -m pip install --no-cache-dir -r /tmp/analytical-platform-requirements.txt && \
  rm /tmp/analytical-platform-requirements.txt

RUN sed -i '/^VERSION_SHA_LENGTH = .*/i # CCCS Superset Azure pipeline injection\nBUILD_NUMBER = '${BUILD_NUMBER}'\n' /app/superset/config.py \
  && pip install --no-cache-dir -r /tmp/requirements.txt \
  && rm /tmp/requirements.txt

# From: https://github.com/apache/superset/issues/25307#issuecomment-1885154970
RUN sed -i "525i \        return None" /app/superset/db_engine_specs/presto.py
RUN sed -i 79,96d /app/superset/db_engine_specs/trino.py

ENV BUILD_NUMBER_VAR=${BUILD_NUMBER}


USER superset
