document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#mobile-inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#mobile-sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#mobile-archived').addEventListener('click', () => load_mailbox('archive'));

  // By default, load the inbox
  load_mailbox('inbox');

  //send email
  const send = document.querySelector('#submit');

  send.addEventListener('click', e=>{
    e.preventDefault();
    sendEmail();
  })

});




function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-render').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-recipients').disabled = false;
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-render').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `
  <h3 class='title'>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
  <div class="email-list"></div>
  `;

  //render email
  renderEmailList(mailbox);

}



/* list of apis to use, apis para leer emails de la base de datos*/

async function getEmail(api){
  const response = await fetch(`/emails/${api}`);
  const data = await response.json();
  return data
} 





/* POST email api para enviar un email devuelve una respuesta sactisfactoria si se envia, o un error*/

async function postEmail(recipients, subject, body){
  let newBody = body.replace(/\n/g, "<br>")
  const response = await fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: newBody,
    })
  });
  const data = await response.json();
  load_mailbox('sent')
}


/* Api to read/unread and archived/unarchived, para cambiar los estados */

async function readEmail(id){
  const response = await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    })
  });
}

async function archiveEmail(id){
  const response = await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true,
    })
  });
}

async function unarchiveEmail(id){
  const response = await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false,
    })
  });
}



/* send email code */

async function sendEmail(){
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value + "\n";
  await postEmail(recipients, subject, body);
}



//render emails list
async function renderEmailList(option){
  const list = document.querySelector('.email-list');
  list.innerHTML = '';
  
  const data = await getEmail(option);
    if(data.length){
      data.forEach(email => {
        const reciList= email.recipients.join(', ');
        const div = document.createElement('div');
        (email.read)? div.classList.add('email', 'read') : div.classList.add('email');
        div.dataset.id = email.id;
        div.innerHTML = `
        <h4>${(option === 'sent')? `To: ${reciList}` : `From: ${email.sender}`}</h4>
        <p ${(option !== 'sent')? `class="psubject"` : `class="psubject psubject-mobile"`}>${email.subject}</p>
        <p class="ptime">${email.timestamp}</p>
        `;
        div.addEventListener('click', e=>{
          let id;
          if(e.target.dataset['id']){
            id = e.target.dataset['id'];
          }else{
            id = e.target.parentElement.dataset['id'];
          }
          e.cancelBubble = true;
          renderEmailView(id, option);
        })
        list.append(div);
        
        //if is not send render archive button
        if(option !== 'sent'){
          const button = document.createElement('img');
          button.src = `${(option === 'archive')? `https://i.imgur.com/cdweDPH.png` : `https://i.imgur.com/bTlb0LY.png`}`;   
          button.classList.add("archived", "archive-img");
          div.append(button)
          button.addEventListener('click', e=>{
            e.cancelBubble = true
            let id = e.target.parentElement.dataset['id'];
            buttonArchived(id);
          })
        }
        
      });

    }else{
      list.textContent = 'No emails to show';
    };

}

//render email view
async function renderEmailView(id, option){
  const data = await getEmail(id);
  const mailContainer = document.querySelector('#email-render');
  mailContainer.innerHTML = '';
  const div = document.createElement('div')
  
  div.innerHTML = `
    <h4 class="view-subject">${data.subject}</h4>
    <h3 class="view-sender">From: ${data.sender}</h3>
    <p class="view-time">${data.timestamp}</p>
    <h3 class="view-recipient">To: ${data.recipients.join(', ')}</h3>
    <p class="email-body">${data.body}</p>
    `;
    mailContainer.append(div);
    
    if(option !== "sent"){
      const buttonReply = document.createElement('button');
      buttonReply.classList.add("button-square");
      buttonReply.innerHTML = `Reply`;
      mailContainer.append(buttonReply)
      buttonReply.addEventListener('click', e=>{
        reply_email(data.sender, data.subject, data.body, data.timestamp)
      })
      
      const buttonUnarchive = document.createElement('button');
      buttonUnarchive.classList.add("button-square", "archive-btn");
      buttonUnarchive.innerHTML = `${(data.archived)? "Move to inbox" : "Archive"}`;
      mailContainer.append(buttonUnarchive);
      buttonUnarchive.addEventListener('click', () => buttonArchived(id));
    }
    

    load_mail()
    readEmail(id)
} 

function load_mail() {
  // Show email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-render').style.display = 'block';
}


// "archived/unarchived" function
async function buttonArchived(id){
  const data = await getEmail(id);
  if(data.archived){
    await unarchiveEmail(id)
  }else{
    await archiveEmail(id)
  }
  load_mailbox('inbox');
}

//function reply
function reply_email(to, subject, body, time) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-render').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = to;
  document.querySelector('#compose-recipients').disabled = true;
  document.querySelector('#compose-subject').value = `${(subject.startsWith('Re'))? `${subject}` : `Re: ${subject}`}`;
  
  if(subject.startsWith("Re")){
    let newBody = body.split(".....");
    let last = newBody.pop();
    document.querySelector('#compose-body').value = `${newBody}\n "On ${time}, ${to} wrote:" \n ${last} \n ..... \n`;
  }else{
    document.querySelector('#compose-body').value = `On ${time}, ${to} wrote: \n ${body} \n ..... \n`;
  }
}
