// Session store
const session = {};

export function get(id) {
  return session[id];
}

export function remove(id) {
  delete session[id];
}
  
export function set(id, value) {
  session[id] = value;
}

export default {
  get,
  remove,
  set,
}
