document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    document.querySelector('#compose-form').onsubmit = compose_submit;

    // By default, load the inbox
    load_mailbox('inbox');
});


function compose_email() {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';


    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function compose_submit() {
    const compose_recipients = document.querySelector('#compose-recipients').value;
    const compose_subject = document.querySelector('#compose-subject').value;
    const compose_body = document.querySelector('#compose-body').value;

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: compose_recipients,
            subject: compose_subject,
            body: compose_body
        })
    })
    .then(response => response.json())
    .then(result => {
            load_mailbox('sent');
        });
    return false;
}

function load_mailbox(mailbox) {

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
        console.log(emails);
        Object.keys(emails).forEach(key => {
            const email = emails[key];

            const elem_email = document.createElement('div');
            elem_email.classList.add('email');
            if (email.read) {
                elem_email.classList.add('is_read');
            }
            elem_email.innerHTML = `
                <div>Subject: ${email.subject}</div>
                <div>Sender: ${email.sender}</div>
                <div>Date: ${email.timestamp}</div>
            `;

            elem_email.addEventListener('click', () => load_email(email.id, mailbox));

            document.querySelector('#emails-view').append(elem_email);
            });
        });
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

}


function load_email(id, mailbox) {
    // Show email view and hide different email
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';

    // Change in db email is_read
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
                read: true
        })
    })

    // Check mailbox is email and return true
    let sent_page = false;
    if (mailbox==="sent"){
        sent_page = true;
    }

    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            // Add email view
            document.querySelector('#email-view').innerHTML = `
                <div>From: ${email.sender}</div>
                <div>To: ${email.recipients}</div>
                <div>Subject: ${email.subject}</div>
                <div>Timestamp: ${email.timestamp}</div>

                <div class="email-buttons">
                    <button class="btn-email" id="reply">Reply</button>
                    <button class="btn-email" id="archive">${email["archived"] ? "Unarchive" : "Archive"}</button>
                </div>

                <div>
                    ${email.body}
                </div>
            `;

            if (sent_page) {
                document.querySelector('.email-buttons').style.display = 'none';
            }

            // Click button archive
            document.querySelector('#archive').addEventListener('click', () => archive_email(id, email))

            // Click button reply
            document.querySelector('#reply').addEventListener('click', () => reply_email(email))
        })
}

function archive_email (id, email) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
            })
        })
        .then(email => {
            load_mailbox('inbox');
        });
}

function reply_email (email) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-recipients').value = email.sender;

    // Check is subject starts "Re:"
    if (email.subject.slice(0,3) != "Re:") {
        document.querySelector('#compose-subject').value = "Re:" + email.subject;
    }
    else {
        document.querySelector('#compose-subject').value = email.subject;
    }
    // Add "On" in start body email and "wrote"
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n\n`;
}