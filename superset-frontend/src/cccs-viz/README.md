<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

CCCS-VIZ for Superset
=====================

<br>
<br>

Creating a custom viz
=====================

Modified instructions from
https://superset.apache.org/docs/installation/building-custom-viz-plugins

```bash
cd superset/superset-frontend/cccs-viz/plugins
mkdir plugin-chart-data-grid
cd plugin-chart-data-grid
yo @superset-ui/superset
```

Modifying your custom viz
=====================

Edit `superset/superset-frontend/package.json` and add the followin line.

```diff

  "homepage": "https://superset.apache.org/",
  "dependencies": {
+    "@superset-ui/plugin-chart-data-grid": "^0.0.0",

```

Edit `superset/superset-frontend/src/visualizations/presets/MainPreset.js`
```diff

+ import { DataGridChartPlugin } from '@superset-ui/plugin-chart-data-grid';

  export default class MainPreset extends Preset {
    constructor() {
      super({
        name: 'Legacy charts',
        presets: [new DeckGLChartPreset()],
        plugins: [
+         new DataGridChartPlugin().configure({key: 'data_grid'}),

```

Create a link of our source in the node_modules folder (hot code replacement depends on this)
```

cd superset/superset-frontend
npm link ./cccs-viz/plugins/plugin-chart-data-grid/

```

Run dev-server
```

cd superset/superset-frontend
npm run dev-server -- --host=<host ip> --port=9000

```

Develop the custom viz. You can connect to port 9000 to test your modifications. When it's ready to be deployed in the docker image you have to do the following

<br>
<br>
<br>



Test your code changes inside the docker container
==================

Once you are done developing the custom viz and are ready to commit your code and build a docker image you can test the npm install will work this is what docker file does.

Edit `superset/superset-frontend/package.json` make sure it installs from the file location (not a published npm package)

```diff

-    "@superset-ui/plugin-chart-data-grid": "^0.0.0",

+    "@superset-ui/plugin-chart-hello-world": "file:./cccs-viz/plugins/plugin-chart-data-grid",

```

Edit `superset/superset-frontend/src/visualizations/presets/MainPreset.js`
Make sure to point package install dir
```diff

-   import { DataGridChartPlugin } from '@superset-ui/plugin-chart-data-grid';

+   import { DataGridlineChartPlugin } from '../../../cccs-viz/plugins/plugin-chart-data-grid';

```

It's important to know that the docker-compose uses the files of the host system so you absolutely need to build your cccs-viz inside your git clone.


This will create the esm and lib files.
```bash

cd /superset/superset-frontend/cccs-viz
npm install
yarn build

```
The same goes for the frontend it will use those files so you need to build the frontend
```

cd superset/superset-frontend
npm install
npm run build

```

Now ready to test docker build
```bash

cd superset
docker build -t 'uchimera.azurecr.io/cccs/superset:latest' .

```

You can test your docker image using docker-compose, the docker-compose.yaml uses the image we just built.
```bash

cd superset
docker-compose up

```

You can connect to superset on port 8088 to test the superset server running inside the docker container.



<br>
<br>
<br>



Commiting your code
==================

When it works locally from your own docker container you can commit your changes

Add custom viz files and the config files that reference it
```bash

cd superset
git add superset-frontend/package-lock.json
git add superset-frontend/package.json
git add superset-frontend/src/visualizations/presets/MainPreset.js
git add superset-frontend/cccs-viz/plugins/plugin-chart-data-grid/
git push origin master

```

