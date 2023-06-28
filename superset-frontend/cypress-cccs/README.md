Instructions on how to run the CCCS Cypress tests using the UI
==============================================================

These are some instructions on how to install and run Cypress tests in WSL. The can be easily adapted to run within the Superset container.

Install Linux dependecies
=========================

Ref: https://docs.cypress.io/guides/getting-started/installing-cypress#Linux-Prerequisites

Install an X Server software
============================

Ref: https://confluence.devtools.cse-cst.gc.ca/pages/viewpage.action?pageId=122520298#WindowsSubsystemforLinux(WSL2)-vcxsrv

Install either MobaXterm or vcxsrv and start X Server.

Install Cypress
===============

Clone the Superset fork repo and checkout a release branch.

Change directory to superset-frontend/cypress-cccs

Install Cypress and other dependencies by running npm install

If you have issues downloading Cypress, try the following:

With your browser, download Cypress with the correct version. The required version can be found in the dependencies section of the file <superset repo>superset-frontend/cypress-cccs/package.json

For example, for 10.2.0, get cypress.zip at https://download.cypress.io/desktop/10.2.0?platform=linux

Copy the file to your wsl environment

Set the CYPRESS_INSTALL_BINARY variable to avoid the download. For exmaple:

export CYPRESS_INSTALL_BINARY=/home/jjgrego/cypress.zip

Re-run the npm install

This should install the proper Cypress version in the ~/.cache/Cypress folder

Go to <superset repo>superset-frontend/cypress-cccs/

Run the Cypress UI
==================

Run the following command:

./node_modules/.bin/cypress open --config-file ./cypress-u.json

This will the configuration file for U prod. Other config files are available. 

Please note that tests cannot be run headless due to the authentication done with Azure. For the same reason, running these tests with the UI might require to enter their credentials to log in with Azure.




