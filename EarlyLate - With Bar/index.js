let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');

socket.onopen = () => console.log('Successfully Connected');

socket.onclose = (event) => {
  console.log('Socket Closed Connection: ', event);
  socket.send('Client Closed!');
};

socket.onerror = (error) => console.log('Socket Error: ', error);

// const ifHit = (currHits, prevHits) => {
//   const allCurrHits =
//     currHits['0'] + currHits['50'] + currHits['100'] + currHits['300'];
//   const allPrevHits =
//     prevHits !== null
//       ? prevHits['0'] + prevHits['50'] + prevHits['100'] + prevHits['300']
//       : 0;
//   return (allCurrHits > 1 && prevHits === null) || allCurrHits > allPrevHits;
// };
const ifErrorHit = (currHits, prevHits) => {
  const allCurrErrors = currHits['50'] + currHits['100'];
  const allPrevErrors =
    prevHits !== null ? prevHits['50'] + prevHits['100'] : 0;
  return (
    (allCurrErrors > 1 && prevHits === null) || allCurrErrors > allPrevErrors
  );
};

const setOffsetEarly = (latestError, error, error_offset, error_hist) => {
  error.innerHTML = `EARLY`;
  error_offset.innerHTML = `${-latestError}ms`;
  error.style.color = 'rgb(0, 128, 255)';
  error_offset.style.color = 'rgb(0, 128, 255)';
  let errorVal = Math.min(Math.abs(latestError), 100);
  error_offset.style.fontSize = `${0.3 + (0.5 / 100) * errorVal}rem`;

  error_hist.removeChild(error_hist.lastElementChild);
  const errorBlock = document.createElement('div');
  errorBlock.className = 'error-early';
  error_hist.prepend(errorBlock);
};

const setOffsetLate = (latestError, error, error_offset, error_hist) => {
  error.innerHTML = `LATE`;
  error_offset.innerHTML = `${latestError}ms`;
  error.style.color = 'red';
  error_offset.style.color = 'red';
  let errorVal = Math.min(Math.abs(latestError), 100);
  error_offset.style.fontSize = `${0.3 + (0.5 / 100) * errorVal}rem`;

  error_hist.removeChild(error_hist.lastElementChild);
  const errorBlock = document.createElement('div');
  errorBlock.className = 'error-late';
  error_hist.prepend(errorBlock);
};

const doResetAnimation = (element) => {
  element.style.animation = 'none';
  element.offsetHeight;
  element.style.animation = null;
};

const reset_animation = () => {
  const el = document.getElementById('error');
  const el_o = document.getElementById('error-offset');
  doResetAnimation(el);
  doResetAnimation(el_o);
};

const error = document.getElementById('error');
const error_hist = document.getElementById('error-hist');
for (let i = 0; i < 20; i++) {
  const error_block = document.createElement('div');
  error_block.className = 'error-default';
  error_hist.appendChild(error_block);
}
const error_line = document.getElementById('error-line');
const error_offset = document.getElementById('error-offset');

let prevHits = null;
let currHits = null;
socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data),
      hits = data.gameplay.hits;
    const hitErrors = hits.hitErrorArray;
    if (hitErrors) {
      currHits = hits;
      if (ifErrorHit(currHits, prevHits)) {
        let latestError = hitErrors[hitErrors.length - 1];
        reset_animation();
        if (latestError < 0) {
          setOffsetEarly(latestError, error, error_offset, error_hist);
        } else {
          setOffsetLate(latestError, error, error_offset, error_hist);
        }
      }
      prevHits = currHits;
    } else {
      prevHits = null;
      error_hist.childNodes.forEach((el) => (el.className = 'error-default'));
    }
  } catch (err) {
    console.log(err);
  }
};
