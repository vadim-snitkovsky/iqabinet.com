# What iQabinet says about Vadim

These notes distinguish archived claims from interpretation. They are research for future personal-site copy.

## The origin story

iQabinet began while Vadim was clearing paper records from his home office. He ran out of filing-cabinet space, bought cardboard filing boxes, and noticed the contradiction. He had spent his career applying technology to business and personal problems, yet household records were still managed much as they had been decades earlier.

The team then asked people a simple question: "Are you organized?" The responses were emotional and personal. Those conversations shaped the product into an intelligent cabinet for personal, financial, and medical records.

Source: `extracted-text/2014--05--01--are-you-organized.txt`.

## The product

iQabinet put household records and documents in one account. It was designed for individuals, couples, people helping aging parents, and customers working with financial advisors, attorneys, or accountants.

Documented capabilities included:

- A guided interview to identify records a person might need.
- Reminders for unfinished setup work.
- Automatic statement retrieval from financial, utility, and telecommunications accounts.
- Upload by file, phone camera, or email.
- Search across record fields and document names.
- Sharing with separate view and manage permissions.
- Tags for ownership and physical storage location.
- Archiving that kept old records searchable without cluttering the default view.

Sources: `extracted-text/home.txt`, `extracted-text/product.txt`.

## The trust model

The archived site described AES-128 encryption with a separately derived key for each user, HMAC for limited search and indexing fields, SSL for every connection, encrypted file metadata, Amazon S3 durability, regular backups, and integrity checks on updates. It also claimed that administrators could not view customer records or uploaded documents.

Its Privacy and Security Bill of Rights made the business model part of the security story. Customers would not be treated as advertising inventory. Users controlled sharing and encryption keys. The company said it would not market their information and would communicate good or bad news directly.

Sources: `extracted-text/security.txt`, `extracted-text/privacy-and-security-bill-of-rights.txt`.

## What the work demonstrates

- Vadim starts with a concrete personal problem, then checks whether other people experience it before committing to a product.
- He was working on consumer privacy, encryption, account aggregation, access control, and shared household data before privacy-first product language became common.
- He treated business-model alignment as a technical concern. Charging customers was meant to keep the service accountable to them rather than to advertisers.
- The product connected software to messy family responsibilities, including shared finances, professional advice, and care for aging parents.
- The Manilla migration story shows a recurring interest in helping users recover when another service disappears. That same instinct later became the center of SwitchPilot.

The final point is an inference across the iQabinet and SwitchPilot archives. Both products respond to discontinued services by helping people retain access to data or hardware they already rely on.

## The Manilla lesson

When Manilla announced its shutdown, iQabinet built a statement importer for former users. The company did not position itself as a clone. It argued that a paid service had a better chance of surviving than a free product without a durable source of revenue.

Source: `extracted-text/2014--08--04--welcome-manilla-users.txt`.

## Claims to phrase carefully

- "Military grade" was the site's marketing phrase. Future copy should state the actual archived implementation claims instead.
- The archived security page describes the intended system architecture. It is not an independent audit or certification.
- The site said administrators could not view customer data, but the archive alone cannot verify that claim.
- References to AWS physical security and cryptographic guidance describe the service as it existed then. They should not be presented as current facts.
- The archive proves that iQabinet offered a beta and described these capabilities. It does not establish adoption, revenue, or long-term availability.
