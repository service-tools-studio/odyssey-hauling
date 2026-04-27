import nodemailer from 'nodemailer';

type ContactPayload = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  scheduledDate: string;
  hazardousMaterial: string;
  itemList: string;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const honeypot = clean(formData.get('website'));

    if (honeypot) {
      return Response.json({ ok: true });
    }

    const files = formData
      .getAll('photos')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const totalAttachmentBytes = files.reduce((sum, file) => sum + file.size, 0);
    const maxAttachmentBytes = 20 * 1024 * 1024; // stay under common SMTP limits (e.g. Gmail ~25MB)
    if (totalAttachmentBytes > maxAttachmentBytes) {
      return Response.json(
        { error: 'Attached files are too large. Please keep combined attachments under 20MB.' },
        { status: 400 },
      );
    }

    const payload: ContactPayload = {
      fullName: clean(formData.get('fullName')),
      email: clean(formData.get('email')),
      phone: clean(formData.get('phone')),
      location: clean(formData.get('location')),
      scheduledDate: clean(formData.get('scheduledDate')),
      hazardousMaterial: clean(formData.get('hazardousMaterial')),
      itemList: clean(formData.get('itemList')),
    };

    if (!payload.fullName || !payload.email || !payload.phone || !payload.location || !payload.itemList) {
      return Response.json(
        { error: 'Missing required fields. Name, email, phone, location, and item list are required.' },
        { status: 400 },
      );
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true';

    if (!host || !user || !pass) {
      return Response.json(
        {
          error:
            'Email is not configured yet. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and optional SMTP_SECURE/CONTACT_FROM.',
        },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const from = process.env.CONTACT_FROM || user;
    const to = process.env.CONTACT_TO || 'service.tools.studio@gmail.com';
    const subject = `New Odyssey Hauling quote request: ${payload.fullName}`;
    const photoFileNames = files.map((file) => file.name);
    const photoFiles = photoFileNames.length > 0 ? photoFileNames.join(', ') : 'None provided';

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type || undefined,
      })),
    );

    const text = [
      'New quote request submitted from odyssey-hauling website.',
      '',
      `Name: ${payload.fullName}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone}`,
      `Location: ${payload.location}`,
      `Scheduled date: ${payload.scheduledDate || 'Not provided'}`,
      `Hazardous material: ${payload.hazardousMaterial || 'Not provided'}`,
      `General list of items: ${payload.itemList}`,
      `Uploaded file names: ${photoFiles}`,
    ].join('\n');

    await transporter.sendMail({
      from: `"${payload.fullName}" <${payload.email}>`,
      sender: from,
      to,
      subject,
      text,
      replyTo: payload.email,
      attachments,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Contact form email failed:', error);
    return Response.json({ error: 'Unable to send request right now. Please try again.' }, { status: 500 });
  }
}
