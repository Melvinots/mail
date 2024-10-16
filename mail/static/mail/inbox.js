document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Run a function when form is submitted *
  document.querySelector('#compose-form').onsubmit = (event) => {
    event.preventDefault();
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    send_email(recipients, subject, body);
  }
});

function send_email(recipients, subject, body) {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert(data.error)
    }
  })
  .then(() => load_mailbox('sent'))
}

function get_mailbox(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const element = document.createElement('div');
      element.className = email.read ? 'email-item read' : 'email-item';
      element.innerHTML = 
      `<div>
          <div class="email-sender">${email.sender}</div>
          <div class="email-details">
            <span class="email-subject">${email.subject}</span>
            <span class="email-timestamp">${email.timestamp}</span>
          </div>
        </div>
      `;
      element.addEventListener('click', () => {
        markAsRead(email.id);
        load_content(email.id, mailbox);
      }) 
      document.querySelector('#emails-view').append(element);
    })
  })
}

function markAsRead(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function toggleArchive(email_id, archive) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archive
    })
  })
  .then(() => load_mailbox('inbox'))
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#content-view').style.display = 'none';

  // Clear out or pre-fill composition fields 
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h2>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h2>`;

  // Show the list of emails *
  get_mailbox(mailbox);
}

function load_content(email_id, mailbox) {
  
  // Show the content view and hide other views
  document.querySelectorAll('#emails-view, #compose-view').forEach(view => view.style.display = 'none');
  const contentView = document.querySelector('#content-view');
  contentView.style.display = 'block';
  contentView.innerHTML = ''; // Clear out previous content

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(data => {
    
    // Email contents
    const element = document.createElement('div');
    element.className = 'email-view'
    element.innerHTML = 
      `<div class="email-header">
            <div><b>From:</b> ${data.sender}</div>
            <div><b>To:</b> ${data.recipients}</div>
            <div><b>Subject:</b> ${data.subject}</div>
            <div><b>Timestamp:</b> ${data.timestamp}</div>
        </div>
        <div class="email-body">
            <hr/>
            <p>${data.body}</p>
        </div>
        <div class="email-actions">
            <button class="btn-archive"></button>
            <button class="btn-reply">Reply</button>
        </div>
      `;
    contentView.append(element);

    // Archive button
    const archiveButton = document.querySelector('.btn-archive');
    if (mailbox !== 'sent') {
      archiveButton.innerHTML = mailbox === 'inbox' ? 'Archive' : 'Unarchive';
      archiveButton.addEventListener('click', () => {
        toggleArchive(email_id, mailbox === 'inbox');
      });
    } else {
      archiveButton.style.display = 'none';
    }

    // Reply button
    const replyButton = document.querySelector('.btn-reply');
    replyButton.addEventListener('click', () => {
      compose_email();
      const formattedSubject = !data.subject.startsWith("Re:") ? `Re: ${data.subject}` : data.subject;
      const formattedBody = `On  ${data.timestamp} <${data.sender}> wrote: ${data.body}\n`;

      document.querySelector('#compose-recipients').value = data.sender;
      document.querySelector('#compose-subject').value = formattedSubject;
      document.querySelector('#compose-body').value = formattedBody + '\n';
    });
  })
}

