## @superset-ui/plugin-chart-data-grid

[![Version](https://img.shields.io/npm/v/@superset-ui/plugin-chart-data-grid.svg?style=flat-square)](https://www.npmjs.com/package/@superset-ui/plugin-chart-data-grid)

This plugin provides Data Grid for Superset.

### Usage

Configure `key`, which can be any `string`, and register the plugin. This `key` will be used to lookup this chart throughout the app.

```js
import DataGridChartPlugin from '@superset-ui/plugin-chart-data-grid';

new DataGridChartPlugin()
  .configure({ key: 'data-grid' })
  .register();
```

Then use it via `SuperChart`. See [storybook](https://apache-superset.github.io/superset-ui/?selectedKind=plugin-chart-data-grid) for more details.

```js
<SuperChart
  chartType="data-grid"
  width={600}
  height={600}
  formData={...}
  queriesData={[{
    data: {...},
  }]}
/>
```

### File structure generated

```
├── package.json
├── README.md
├── tsconfig.json
├── src
│   ├── DataGrid.tsx
│   ├── images
│   │   └── thumbnail.png
│   ├── index.ts
│   ├── plugin
│   │   ├── buildQuery.ts
│   │   ├── controlPanel.ts
│   │   ├── index.ts
│   │   └── transformProps.ts
│   └── types.ts
├── test
│   └── index.test.ts
└── types
    └── external.d.ts
```