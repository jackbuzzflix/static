const form = document.querySelector('[data-application-form]');

if (form) {
  const endpoint = form.dataset.endpoint.trim();
  const preview = !endpoint;
  const button = form.querySelector('[type=submit]');
  const error = form.querySelector('.application-error');
  const status = form.querySelector('.application-submit-status');
  const note = document.querySelector('#application-preview-note');
  const confirmation = document.querySelector('[data-application-confirmation]');
  const video = form.elements.video;
  const selection = document.querySelector('#video-selection');
  const roles = [form.elements.role_1, form.elements.role_2, form.elements.role_3];
  const maxBytes = 100 * 1024 * 1024;
  let sending = false;
  let submissionId = null;

  button.disabled = false;
  button.textContent = preview ? 'Preview submission' : 'Submit application';
  note.hidden = !preview;
  if (!preview) form.removeAttribute('aria-describedby');

  const validateRoles = () => {
    const seen = new Set();
    roles.forEach(input => {
      const value = input.value.trim().toLowerCase();
      input.setCustomValidity(!value ? 'Please enter a role.'
        : seen.has(value) ? 'Please list three different roles.' : '');
      if (value) seen.add(value);
    });
  };
  roles.forEach(input => input.addEventListener('input', validateRoles));
  ['name', 'school', 'experience'].forEach(name => {
    const input = form.elements[name];
    const validate = () => input.setCustomValidity(input.value.trim() ? '' : 'Please complete this field.');
    input.addEventListener('input', validate);
  });

  const validateVideo = () => {
    const file = video.files[0];
    video.setCustomValidity('');
    selection.textContent = '';
    if (!file) return;
    const supported = /\.(mp4|mov|webm)$/i.test(file.name);
    if (!supported) video.setCustomValidity('Please choose an MP4, MOV, or WebM video.');
    else if (file.size > maxBytes) video.setCustomValidity('Please choose a video smaller than 100 MB.');
    else if (!file.size) video.setCustomValidity('This file is empty. Please choose your video again.');
    selection.textContent = video.validationMessage || `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB selected`;
  };
  video.addEventListener('change', validateVideo);

  const showConfirmation = emailQueued => {
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.querySelector('[data-confirmation-eyebrow]').textContent = preview ? 'Submission preview' : 'Buzzflix 2027';
    const heading = confirmation.querySelector('[data-confirmation-title]');
    heading.textContent = preview ? 'Thanks for applying!' : 'Your application is in.';
    confirmation.querySelector('[data-confirmation-message]').textContent = preview || emailQueued
      ? 'You’ll shortly receive a confirmation email. Expect to hear back from us within two weeks.'
      : 'We’ve received your application. Expect to hear back from us within two weeks.';
    confirmation.querySelector('[data-confirmation-note]').textContent = preview
      ? 'Preview only. This shows the future confirmation screen. No application was sent and no confirmation email will be delivered.'
      : 'Thank you for sharing your story with Buzzflix.';
    confirmation.querySelector('[data-preview-reset]').hidden = !preview;
    heading.focus();
  };

  confirmation.querySelector('[data-preview-reset]').addEventListener('click', () => {
    confirmation.hidden = true;
    form.hidden = false;
    button.focus();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    validateRoles();
    validateVideo();
    ['name', 'school', 'experience'].forEach(name => {
      const input = form.elements[name];
      input.setCustomValidity(input.value.trim() ? '' : 'Please complete this field.');
    });
    if (!form.reportValidity()) return;
    error.hidden = true;
    if (preview) {
      showConfirmation(false);
      return;
    }

    sending = true;
    button.disabled = true;
    status.textContent = 'Sending your application and video. Please keep this page open.';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const data = new FormData(form);
      submissionId ||= crypto.randomUUID();
      data.set('submission_id', submissionId);
      data.set('application_year', '2027');
      data.set('consent_version', '2027-v1');
      const response = await fetch(endpoint, { method:'POST', body:data, signal:controller.signal, headers:{Accept:'application/json'} });
      if (!response.ok) throw new Error('submission-failed');
      const result = await response.json();
      if (result.accepted !== true) throw new Error('submission-not-confirmed');
      showConfirmation(result.confirmationEmailQueued === true);
      form.reset();
    } catch (failure) {
      error.textContent = failure.name === 'AbortError'
        ? 'We couldn’t confirm your submission in time. Your entries are still here. Please try again; the same submission reference will be reused.'
        : 'We couldn’t confirm your application was received. Your entries are still here. Please try again.';
      error.hidden = false;
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      status.textContent = '';
    }
  });
}
