import { createTransport, getTestMessageUrl } from 'nodemailer';

const transport = createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

function makeANiceEmail(text: string): string {
  return `
<div style='
border= 1px black solid;
padding: 20px;
font-family: sans-serif;
line-height: 2;
font-size: 20px;
'>
<h2>Hello There!</h2>
<p>${text}</p>
<p>😘, Amzat</p>

</div>
`;
}

export async function sendAPasswordResetEmail(
  resetToken: string,
  to: string
): Promise<void> {
  // email the user a token
  const info = await transport.sendMail({
    to,
    from: 'kunmi@gmail.com',
    subject: 'Your password reset token!',
    html: makeANiceEmail(`Your password reset Token is here! 
        
        <a href="${process.env.FRONTEND_URL}/reset?token=${resetToken}">Click here to reset</a>
        `),
  });
  console.log(info);
  if (process.env.MAIL_USER.includes('ethereal.email')) {
    console.log(`📧 Message sent! Preview it at ${getTestMessageUrl(info)}`);
  }
}
