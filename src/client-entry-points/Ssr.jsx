import SsrComponent, { ssr } from '../components/Ssr';

// Read wrapper from SSR export
const { wrapper: componentWrapper } = ssr;

// Import wrappers, only required if component defines wrapper via string
// import wrappers from '../wrappers';
const wrappers = {};

// Find wrapper and/or associated renderer
const { renderClient: render } = (typeof (componentWrapper) === 'string')
  ? wrappers[componentWrapper]
  : componentWrapper;

// If client render function exists, use it to display component
if (render) {
  render('fuelphp-vite-react-example', SsrComponent);
}
