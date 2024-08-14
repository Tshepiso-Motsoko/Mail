document.addEventListener('DOMContentLoaded', function() {
    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    // Handle the email submission
    document.querySelector('#compose-form').onsubmit = function(event) {
        event.preventDefault();

        // Send POST request to the server
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                alert(result.error);
            } else {
                load_mailbox('sent');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while sending the email.');
        });
    };
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Load the emails from the mailbox
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        // Display the emails
        emails.forEach(email => {
            const email_div = document.createElement('div');
            email_div.className = `email-item ${email.read ? 'read' : 'unread'}`;
            email_div.innerHTML = `<strong>${email.sender}</strong> ${email.subject} <span class="timestamp">${email.timestamp}</span>`;
            email_div.addEventListener('click', () => load_email(email.id));
            document.querySelector('#emails-view').append(email_div);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while loading emails.');
    });
}

function load_email(email_id) {
    // Show the email and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Clear the email view
    document.querySelector('#email-view').innerHTML = '';

    // Load the email details
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        // Display email details
        const email_details = `
            <strong>From:</strong> ${email.sender}<br>
            <strong>To:</strong> ${email.recipients.join(', ')}<br>
            <strong>Subject:</strong> ${email.subject}<br>
            <strong>Timestamp:</strong> ${email.timestamp}<br>
            <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
            ${!email.archived ? `<button class="btn btn-sm btn-outline-secondary" id="archive">Archive</button>` : `<button class="btn btn-sm btn-outline-secondary" id="unarchive">Unarchive</button>`}
        `;
        document.querySelector('#email-view').innerHTML = email_details;

        // Mark email as read
        fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
        });

        // Reply button
        document.querySelector('#reply').addEventListener('click', () => {
            compose_email();
            document.querySelector('#compose-recipients').value = email.sender;
            document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
            document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n\n`;
        });

        // Archive/Unarchive button
        const archive_button = document.querySelector('#archive') || document.querySelector('#unarchive');
        if (archive_button) {
            archive_button.addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: !email.archived
                    })
                })
                .then(() => load_mailbox('inbox'));
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while loading the email.');
    });
}
