import RenderClientElements from './RenderClientElements';
import RenderServerSide from './RenderServerSide';

export const parameter = 'id';

export function renderClient(id, Component, props, ssr) {
  // console.log(`Looking for ID: ${id}`);
  // Render into the relevant element
  return RenderClientElements(
    [document.getElementById(id)].filter((element) => element),
    Component,
    props,
    ssr,
  );
}

export function renderServer(Component, props) {
  return RenderServerSide(Component, props);
}

export function template(id, ssr, clientModule) {
  return `
    <div id="${id}">${ssr || ''}</div>
    ${clientModule ? `<script type="module" src="${clientModule}"></script>` : ''}
  `;
}

export default {
  parameter,
  renderClient,
  renderServer,
  template,
};
