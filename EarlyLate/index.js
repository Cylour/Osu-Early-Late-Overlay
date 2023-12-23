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

const setOffsetEarly = (
  curr_error,
  error,
  err_combo_val,
  error_combo,
  error_offset,
  error_line
) => {
  error.innerHTML = `EARLY`;
  error_combo.innerHTML = `&times${err_combo_val}`;
  error_offset.innerHTML = `${-curr_error}ms`;
  error.style.color = 'rgb(0, 128, 255)';
  error_combo.style.color = 'rgb(0, 128, 255)';
  error_offset.style.color = 'rgb(0, 128, 255)';
  error_line.style.backgroundColor = 'rgb(0, 128, 255)';
  let errorVal = Math.min(Math.abs(curr_error), 100);
  error_offset.style.fontSize = `${0.2 + (0.7 / 100) * errorVal}rem`;
  error_line.style.boxShadow = `0px 0px 50px ${
    5 + (30 / 100) * errorVal
  }px rgb(0, 128, 255)`;
};

const setOffsetLate = (
  curr_error,
  error,
  err_combo_val,
  error_combo,
  error_offset,
  error_line
) => {
  error.innerHTML = `LATE`;
  error_combo.innerHTML = `&times${err_combo_val}`;
  error_offset.innerHTML = `${curr_error}ms`;
  error.style.color = 'red';
  error_combo.style.color = 'red';
  error_offset.style.color = 'red';
  error_line.style.backgroundColor = 'red';
  let errorVal = Math.min(Math.abs(curr_error), 100);
  error_offset.style.fontSize = `${0.2 + (0.7 / 100) * errorVal}rem`;
  error_line.style.boxShadow = `0px 0px 50px ${
    5 + (30 / 100) * errorVal
  }px red`;
};

const setOffsetSlider = (
  curr_error,
  error,
  err_combo_val,
  error_offset,
  error_line
) => {
  error.innerHTML = `MISS SLIDER END`;
  error_combo.innerHTML = `&times${err_combo_val}`;
  error.style.color = 'purple';
  error_offset.innerHTML = '';
  error_line.style.backgroundColor = 'purple';
  error_line.style.boxShadow = `0px 0px 50px 20px purple`;
};

const doResetAnimation = (element) => {
  element.style.animation = 'none';
  element.offsetHeight;
  element.style.animation = null;
};

const reset_animation = () => {
  const el = document.getElementById('error');
  const el_o = document.getElementById('error-offset');
  const el_l = document.getElementById('error-line');
  const el_c = document.getElementById('error-combo');
  doResetAnimation(el);
  doResetAnimation(el_o);
  doResetAnimation(el_l);
  doResetAnimation(el_c);
};

const set_combo_vals = (err_combo_val) => {
  const err_val = Math.min(err_combo_val, 10);
  document.documentElement.style.setProperty(
    '--combo-size',
    1.1 + (err_val / 10) ** 1.5
  );
  document.documentElement.style.setProperty(
    '--combo-rot',
    10 + 3 * err_val + 'deg'
  );
};

const error = document.getElementById('error');
const error_wrapper = document.getElementById('error-wrapper');
const error_offset = document.getElementById('error-offset');
const error_line = document.getElementById('error-line');
const error_combo = document.getElementById('error-combo');
const od_wrapper = document.getElementById('od-wrapper');
const od_element = document.getElementById('od-ms');

let prev_hits = null;
let curr_hits = null;
let prev_error = null;
let prev_menu_song_id = null;
let err_combo_val = 0;
let od_ms = null;

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data),
      hits = data.gameplay.hits;
    const hitErrors = hits.hitErrorArray;
    const od = data.menu.bm.stats.OD;
    if (data.menu.state == 2) od_wrapper.style.display = 'none';
    else if (od) {
      if (data.menu.bm.id !== prev_menu_song_id) doResetAnimation(od_wrapper);
      od_wrapper.style.display = 'block';
      od_ms = 80 - 6 * Number(od);
      od_element.innerHTML = '±' + Math.round(od_ms * 10) / 10 + 'ms';
      prev_menu_song_id = data.menu.bm.id;
    } else {
      od_wrapper.style.display = 'none';
    }
    if (hitErrors) {
      curr_hits = hits;
      if (ifErrorHit(curr_hits, prev_hits)) {
        let curr_error = hitErrors[hitErrors.length - 1];
        reset_animation();
        // super scuffed Miss slider end
        if (Math.abs(curr_error) < od_ms) {
          if (prev_error === null || prev_error >= 0) err_combo_val = 1;
          else err_combo_val++;
          err_combo_val === 1
            ? (error_combo.style.display = 'none')
            : (error_combo.style.display = 'block');

          set_combo_vals(err_combo_val);
          setOffsetSlider(
            curr_error,
            error,
            err_combo_val,
            error_offset,
            error_line
          );
          // if Early
        } else if (curr_error < 0) {
          if (prev_error === null || prev_error >= 0) err_combo_val = 1;
          else err_combo_val++;
          err_combo_val === 1
            ? (error_combo.style.display = 'none')
            : (error_combo.style.display = 'block');

          set_combo_vals(err_combo_val);

          setOffsetEarly(
            curr_error,
            error,
            err_combo_val,
            error_combo,
            error_offset,
            error_line
          );
          // if Late
        } else {
          if (prev_error === null || prev_error < 0) err_combo_val = 1;
          else err_combo_val++;
          err_combo_val === 1
            ? (error_combo.style.display = 'none')
            : (error_combo.style.display = 'block');

          set_combo_vals(err_combo_val);

          setOffsetLate(
            curr_error,
            error,
            err_combo_val,
            error_combo,
            error_offset,
            error_line
          );
        }
        prev_error = curr_error;
      } else err_combo_val = 0;
      prev_hits = curr_hits;
    } else {
      prev_hits = null;
    }
  } catch (err) {
    console.log(err);
  }
};
