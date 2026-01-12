# Research References and Sources

## Overview
This document contains all references and sources used for the React 19 performance optimization research. URLs should be verified and updated as needed.

## Official React Documentation

### React 19 & Compiler
- **React Compiler Guide**: https://react.dev/learn/react-compiler
- **React 19 Release Notes**: https://react.dev/blog/2024/12/05/react-19
- **React 19 Reference**: https://react.dev/reference/react
- **Render and Commit**: https://react.dev/learn/render-and-commit

### Memoization Hooks
- **useCallback Reference**: https://react.dev/reference/react/useCallback
- **useMemo Reference**: https://react.dev/reference/react/useMemo
- **React.memo Reference**: https://react.dev/reference/react/memo

### Performance Tools
- **React DevTools Profiler**: https://react.dev/learn/react-developer-tools
- **Profiler API**: https://react.dev/reference/react/Profiler

### Learning Resources
- **React Tutorial**: https://react.dev/learn
- **Thinking in React**: https://react.dev/learn/thinking-in-react
- **Escaping the Props Hell**: https://react.dev/learn/scaling-up-with-reducer-and-context

## Community Resources

### Blog Posts & Articles
- **"When to useMemo and useCallback"** (various authors - search for latest)
- **"React Compiler: The End of Manual Memoization?"** (community analysis)
- **"Performance Optimization in React 19"** (tech blogs)
- **"Measuring React Performance"** (dev.to, medium.com)
- **"Why Did You Render"** guides

### Conference Talks
- **React Conf 2024/2025**: React Compiler announcements
- **React Rally**: Performance optimization talks
- **React Summit**: Best practices sessions
- **Reactathon**: Advanced patterns

### GitHub Repositories
- **facebook/react**: Official React repo
- **reactwg/react-compiler**: React Compiler working group
- **welldone-software/why-did-you-render**: Debug re-renders
- **bvaughn/react-devtools**: React DevTools source

## Performance Measurement Tools

### Browser APIs
- **Performance API**: https://developer.mozilla.org/en-US/docs/Web/API/Performance
- **User Timing API**: https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API
- **Performance Observer**: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver

### Web Vitals
- **Web Vitals Library**: https://github.com/GoogleChrome/web-vitals
- **Core Web Vitals**: https://web.dev/vitals/
- **Lighthouse**: https://github.com/GoogleChrome/lighthouse

### Profiling Tools
- **React DevTools**: Browser extension stores
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/
- **Firefox DevTools**: https://firefox-source-docs.mozilla.org/devtools-user/

## Benchmarking Libraries
- **Benchmark.js**: https://benchmarkjs.com/
- **tinybench**: https://github.com/tinylibs/tinybench
- **stats-lite**: Simple statistics for measurements

## Research Papers & Academic Sources
- **React Reconciliation**: Original React documentation on reconciliation
- **Virtual DOM Performance**: Various academic papers
- **Functional Programming in UI**: Research on memoization in UI frameworks

## Case Studies
- **Facebook's React Performance**: Internal team blog posts
- **Shopify's React Optimization**: Engineering blog
- **Airbnb's React Patterns**: Engineering blog
- **Netflix Performance**: Case studies on large-scale React

## Books
- **"React Performance"** (various authors)
- **"Optimizing React Applications"** (search for latest)
- **"React Design Patterns"** (performance chapters)

## Online Courses
- **Epic React**: Performance optimization modules
- **React Performance**: Frontend Masters
- **Advanced React Patterns**: (various platforms)

## YouTube Channels
- **React Official**: Conference recordings
- **Kent C. Dodds**: Performance tutorials
- **Dan Abramov**: Deep dives into React internals
- **Academind**: Performance optimization videos

## Podcasts
- **React Podcast**: Performance episodes
- **Frontend Happy Hour**: React performance
- **Shop Chat**: Engineering optimization discussions

## Twitter/X Threads to Search
- `#ReactPerformance` hashtag
- `@reactjs` official account
- React team member threads on memoization
- Community threads on useCallback overhead

## Reddit Communities
- r/reactjs - Performance optimization posts
- r/frontend - React performance discussions
- r/webdev - Performance optimization threads

## Stack Overflow Tags
- [react-performance]: https://stackoverflow.com/questions/tagged/react-performance
- [useCallback]: https://stackoverflow.com/questions/tagged/usecallback
- [useMemo]: https://stackoverflow.com/questions/tagged/usememo

## Discord/Slack Communities
- **Reactiflux**: #performance channel
- **React Discord**: Official server
- **Frontend Nation**: Performance discussions

## Newsletter Sources
- **React Newsletter**: Weekly updates
- **JavaScript Weekly**: Performance articles
- **Frontend Focus**: Optimization tips

## Documentation Archives
- **React Legacy Docs**: For older patterns
- **React Labs**: Experimental features
- **RFCs**: Proposed changes

## Specific Topics to Research Further

### React 19 Compiler
- [ ] Read official React Compiler documentation
- [ ] Watch React Compiler announcement video
- [ ] Review React Compiler GitHub discussions
- [ ] Test compiler in experimental environment

### useCallback Overhead
- [ ] Find benchmark studies with exact timing
- [ ] Verify 0.01ms overhead figure
- [ ] Research browser-specific variations
- [ ] Check for React version differences

### Profiling Techniques
- [ ] Complete React DevTools Profiler tutorial
- [ ] Practice profiling real applications
- [ ] Learn Chrome DevTools Performance panel
- [ ] Experiment with custom performance measurement

### Memoization Strategies
- [ ] Study React.memo best practices
- [ ] Learn useMemo optimization patterns
- [ ] Understand callback memoization trade-offs
- [ ] Review React Compiler auto-memoization

### Production Considerations
- [ ] Read production build performance guides
- [ ] Study server-side rendering optimization
- [ ] Learn bundle size optimization
- [ ] Understand mobile performance constraints

## Verification Checklist

For each source, verify:
- [ ] URL is current and accessible
- [ ] Content is up-to-date (React 19 era)
- [ ] Author/source is credible
- [ ] Examples are relevant to our use case
- [ ] Metrics are from reliable tests
- [ ] Recommendations are generally accepted

## Notes

### Date Range Focus
- Prioritize: **2024-2025** sources (React 19 era)
- Use with caution: 2022-2023 sources (pre-React Compiler)
- Generally avoid: Pre-2022 sources (outdated patterns)

### Version Compatibility
- Ensure examples use React 18.3+ or 19.0+
- Check if patterns require React Compiler
- Verify browser compatibility for APIs used
- Note any TypeScript-specific considerations

### Quality Indicators
- Official React team sources (highest priority)
- Peer-reviewed articles
- Code examples with reproducible benchmarks
- Multiple independent confirmations
- Active maintenance and updates

## Next Steps for Research

1. **Primary Research** (Official docs first)
   - Read all React.dev documentation links
   - Watch official React team videos
   - Review React Compiler GitHub repo

2. **Secondary Research** (Community insights)
   - Read blog posts with specific metrics
   - Watch conference talks on performance
   - Review community discussions

3. **Practical Research** (Hands-on)
   - Profile example applications
   - Create benchmark tests
   - Test React Compiler optimizations

4. **Synthesis** (Combine findings)
   - Cross-reference multiple sources
   - Identify consensus vs disagreement
   - Document version-specific guidance

## Citation Format

When using these sources in documentation:
```
Title: [Article Title]
Author: [Author Name]
URL: [Full URL]
Date Accessed: [YYYY-MM-DD]
Relevance: [Why this source matters]
```

## Contributing

If you find additional valuable sources:
1. Add to appropriate section above
2. Include full URL and brief description
3. Note date accessed and relevance
4. Update verification checklist

## Reminders

- **Web search tools are rate-limited**: Research may need to be done in batches
- **URLs can change**: Verify links before relying on them
- **React evolves quickly**: Prioritize recent sources (2024-2025)
- **Context matters**: Consider your specific use case when applying recommendations
- **Measure yourself**: Always verify findings with your own profiling

---

**Last Updated**: 2025-01-11
**React Version Focus**: 19.0+
**Research Status**: Needs URL verification and expansion
