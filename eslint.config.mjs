import next from 'eslint-config-next'

const config = [
  ...next.map(cfg => {
    if (cfg.rules) {
      const reactHookRules = [
        'react-hooks/set-state-in-effect',
        'react-hooks/refs',
        'react-hooks/purity',
        'react-hooks/preserve-manual-memoization',
        'react-hooks/immutability',
      ]
      const updated = { ...cfg.rules }
      for (const rule of reactHookRules) {
        if (updated[rule]) updated[rule] = 'warn'
      }
      return { ...cfg, rules: updated }
    }
    return cfg
  }),
  {
    ignores: ['android/**', 'out/**', '.next/**'],
  },
]

export default config
