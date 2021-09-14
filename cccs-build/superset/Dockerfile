<<<<<<< HEAD
FROM uchimera.azurecr.io/cccs/superset-base:cccs-1.3_20210909191324_b1940
=======
FROM uchimera.azurecr.io/cccs/superset-base:cccs-1.3_20210914140545_b1965
>>>>>>> 86db89768... cccs-build/superset/Dockerfile

USER root

COPY requirements.txt /tmp

ARG BUILD_NUMBER=0-development
RUN sed -i '/^VERSION_SHA_LENGTH = .*/i # CCCS Superset Azure pipeline injection\nBUILD_NUMBER = '${BUILD_NUMBER}'\n' /app/superset/config.py \
  && pip install --no-cache-dir -r /tmp/requirements.txt \
  && rm /tmp/requirements.txt

USER superset
