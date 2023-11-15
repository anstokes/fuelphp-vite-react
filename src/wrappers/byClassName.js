import RenderClientElements from './RenderClientElements';
import RenderServerSide from './RenderServerSide';

export const parameter = 'className';

export function renderClient(className, Component, props, ssr) {
  // Render into the relevant elements
  return RenderClientElements(
    Array.from(document.getElementsByClassName(className)),
    Component,
    props,
    ssr,
  );
}

export function renderServer(Component, props) {
  return RenderServerSide(Component, props);
}

export function template(className, ssr, clientModule) {
  return `
    <div class="${className}">${ssr || ''}</div>
    ${clientModule ? `<script type="module" src="${clientModule}"></script>` : ''}
  `;
}

export default {
  parameter,
  renderClient,
  renderServer,
  template,
};
