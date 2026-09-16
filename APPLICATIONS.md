# Buzzflix 2027 application homepage

`home-applications.html` is the application-season clone. `home-current.html` is a snapshot of the existing homepage. The live local homepage (`index.html`) and `/home/` are unchanged.

Serve the project with an HTTP server, then open `/home-applications.html` to preview. All new styles and behavior live in `assets/css/application.css` and `assets/js/application-form.js`; only the application homepage loads these files.

## Switch homepages

From this project directory, run:

```sh
node scripts/switch-home.mjs applications
```

This copies the application-season page to both `index.html` and `home/index.html`, preserving the directory route’s relative asset paths. To switch back:

```sh
node scripts/switch-home.mjs current
```

Edit the named source pages before switching; the switch overwrites the two active homepage files. Replacing local files does not publish the site; commit and push the changes through your usual GitHub workflow.

## Connect the future submission service

The form’s `data-endpoint=""` attribute intentionally starts empty. That enables preview mode: the submit button says “Preview submission,” no data is sent or stored, and the confirmation screen explicitly says no email is delivered. The preview keeps your entries when you return to the form.

Once the service exists, set `data-endpoint` in `home-applications.html` to its HTTPS submission URL. The button will become “Submit application” and the preview notice will disappear. Configure the service before switching the homepage publicly.

The browser sends a multipart POST with these fields:

- `name`, `email`, `school`, `experience`
- `role_1`, `role_2`, `role_3`, `additional_roles`
- `video` (the uploaded file)
- `consent` (`agreed`), `consent_version` (`2027-v1`)
- `application_year` (`2027`)
- `submission_id` (a reference reused on retries of this submission)

Return a successful HTTP status and JSON only after accepting and saving the application:

```json
{"accepted": true, "confirmationEmailQueued": true}
```

The page displays “You’ll shortly receive a confirmation email. Expect to hear back from us within two weeks.” only when the service confirms the email has been queued. An accepted application without that flag gets a receipt message without the email promise. Failed or unconfirmed responses retain the form entries and display an error.

The future service must store the application/video, validate all fields and actual video content, enforce the size limit, handle consent, send the email, protect against abuse, and deduplicate `submission_id` on retries. For an external endpoint, allow CORS POST requests from the deployed site. The client currently accepts MP4, MOV, and WebM files up to 100 MiB, asks for a one-minute video, and requires three distinct roles; any changed limits must match the service and visible form instructions.

The ownership and application consent wording is included in the checkbox. Keep it aligned with your final submission terms and update `consent_version` whenever those terms change.

This is a homepage clone: the existing 2026 updates, partners, photos, and FAQs below the new application section are preserved. Update seasonal content in the clone when you are ready to open applications.
