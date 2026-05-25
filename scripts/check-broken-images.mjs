const chromeUrl = process.env.CHROME_DEBUGGING_URL || 'http://localhost:9222';
const appUrl = process.env.APP_URL || 'http://localhost:5173/';

async function getPageTarget() {
  const response = await fetch(`${chromeUrl}/json/list`);
  if (!response.ok) {
    throw new Error(`Could not read Chrome targets from ${chromeUrl}: ${response.status}`);
  }

  const targets = await response.json();
  const page = targets.find(target => target.type === 'page' && target.url.startsWith(appUrl))
    || targets.find(target => target.type === 'page');

  if (!page?.webSocketDebuggerUrl) {
    throw new Error(`No debuggable Chrome page found. Start Chrome with --remote-debugging-port=9222 and open ${appUrl}.`);
  }

  return page;
}

function createCdpClient(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const eventWaiters = new Map();

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
      return;
    }

    if (message.method && eventWaiters.has(message.method)) {
      const waiters = eventWaiters.get(message.method);
      eventWaiters.delete(message.method);
      for (const resolve of waiters) resolve(message.params);
    }
  });

  function send(method, params = {}) {
    const id = nextId++;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });
  }

  function waitForEvent(method, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const wrappedResolve = params => {
        clearTimeout(timeout);
        resolve(params);
      };
      const waiters = eventWaiters.get(method) || [];
      waiters.push(wrappedResolve);
      eventWaiters.set(method, waiters);
    });
  }

  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => resolve({ send, waitForEvent, close: () => socket.close() }));
    socket.addEventListener('error', () => reject(new Error(`Could not connect to ${wsUrl}`)));
  });
}

const target = await getPageTarget();
const client = await createCdpClient(target.webSocketDebuggerUrl);

try {
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  const load = client.waitForEvent('Page.loadEventFired', 15000).catch(() => null);
  await client.send('Page.navigate', { url: appUrl });
  await load;

  const result = await client.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

      async function inspectImages(context) {
        await wait(500);
        const images = Array.from(document.images);
        await Promise.all(images.map(image => {
          if (image.complete) return Promise.resolve();
          return new Promise(done => {
            const finish = () => done();
            image.addEventListener('load', finish, { once: true });
            image.addEventListener('error', finish, { once: true });
            setTimeout(finish, 5000);
          });
        }));

        return images.map(image => ({
          context,
          alt: image.alt,
          src: image.currentSrc || image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          renderedWidth: Math.round(image.getBoundingClientRect().width),
          renderedHeight: Math.round(image.getBoundingClientRect().height)
        }));
      }

      const results = [];
      const departments = ["Men's", "Women's"];

      for (const department of departments) {
        const button = Array.from(document.querySelectorAll('button'))
          .find(candidate => candidate.textContent.trim() === department);
        if (button) {
          button.click();
          await wait(300);
        }
        results.push(...await inspectImages(department));
      }

      return results;
    })()`
  });

  const images = result.result.value;
  const broken = images.filter(image => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0);

  console.log(`Checked ${images.length} rendered images via Chrome DevTools at ${chromeUrl}`);
  if (broken.length > 0) {
    console.error('Broken images detected:');
    for (const image of broken) {
      console.error(`- ${image.context} / ${image.alt || '(no alt)'}: ${image.src}`);
    }
    process.exitCode = 1;
  } else {
    console.log('No broken images detected.');
  }
} finally {
  client.close();
}
