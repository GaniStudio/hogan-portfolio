export function frameWindow(frame, address, ...notices) {
  const shell = document.createElement('div');
  shell.className = 'demo-window';
  const bar = document.createElement('div');
  bar.className = 'demo-window-bar';
  bar.innerHTML = '<span class="demo-window-lights" aria-hidden="true"><i></i><i></i><i></i></span><span class="demo-window-address"></span>';
  bar.querySelector('.demo-window-address').textContent = address;
  const body = document.createElement('div');
  body.className = 'demo-window-body';
  if (frame.isConnected) frame.before(shell);
  body.append(frame, ...notices);
  shell.append(bar, body);
  return shell;
}
