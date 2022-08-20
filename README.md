### Project Overview
Wouldn't it be great if we could use a slideshow canvas as WSIWYG editor to rapidly design and ship UIs or start coding?

Airppt was built from the ground up to utilize the design elements of PPT presentations and reuse them anywhere. It is built with modularity, extensibility and flexibility in mind whilst abstracting a lot of the complexity. It's **not** a direct PPTX -> HTML converter; more like PPTX -> JSON -> HTML instead.

I'd also love for you to contribute. New to open source? I'm happy to walkthrough how to close your first issue. Pick a [time](https://goo.gl/forms/7NjFEYayLOuYdr2q1) that works best for you.

# airppt-parser

Powerpoint stores information in a series of complex XML mappings. Checkout the [OpenXML Spec](https://www.ecma-international.org/news/TC45_current_work/OpenXML%20White%20Paper.pdf) to get an idea of how [complex](http://officeopenxml.com/anatomyofOOXML-pptx.php) it really is.
