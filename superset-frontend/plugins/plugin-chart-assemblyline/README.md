## @superset-ui/plugin-chart-assemblyline

[![Version](https://img.shields.io/npm/v/@superset-ui/plugin-chart-assemblyline.svg?style=flat-square)](https://www.npmjs.com/package/@superset-ui/plugin-chart-assemblyline)

This plugin provides Assemblyline for Superset.

### Usage

Configure `key`, which can be any `string`, and register the plugin. This `key` will be used to lookup this chart throughout the app.

```js
import AssemblylineChartPlugin from '@superset-ui/plugin-chart-assemblyline';

new AssemblylineChartPlugin()
  .configure({ key: 'assemblyline' })
  .register();
```

Then use it via `SuperChart`. See [storybook](https://apache-superset.github.io/superset-ui/?selectedKind=plugin-chart-assemblyline) for more details.

```js
<SuperChart
  chartType="assemblyline"
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
│   ├── Assemblyline.tsx
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