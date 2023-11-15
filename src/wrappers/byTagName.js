import RenderClientElements from './RenderClientElements';
import RenderServerSide from './RenderServerSide';

export const parameter = 'tagName';

export function renderClient(tagName, Component, props, ssr) {
  // Render into the relevant elements
  return RenderClientElements(
    Array.from(document.getElementsByTagName(tagName)),
    Component,
    props,
    ssr,
  );
}

export function renderServer(Component, props) {
  return RenderServerSide(Component, props);
}

export function template(tagName, ssr, clientModule) {
  return `
    <${tagName}>${ssr || ''}</${tagName}>
    ${clientModule ? `<script type="module" src="${clientModule}"></script>` : ''}
  `;
}

export default {
  parameter,
  renderClient,
  renderServer,
  template,
};
