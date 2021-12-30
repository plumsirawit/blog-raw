# blog-raw
A raw, (finally finished) blog

[![genblogs](https://github.com/plumsirawit/blog-raw/actions/workflows/genblogs.yml/badge.svg?branch=main)](https://github.com/plumsirawit/blog-raw/actions/workflows/genblogs.yml)

## How does it work?
(Just in case I, myself, have a chance to look back at this.) See this figure:

![](https://github.com/plumsirawit/blog-raw/blob/main/blogflow.drawio.svg)

So there is an [admin page](https://blog.plummmm.com/admin.html) which the admin can write anything they want, with the condition that the password provided must be correct. (Will be verified by functions)

And, upon any change in the firestore, an event will be triggered and it will call a function called `listenWrite`. This will trigger a webhook on GitHub Actions called `gen` on workflow `genblogs`.
Now the workflow will be run, and the whole inner process is to pre-render static sites using `yarn build` and then publish them to hosting.

That's all. So in case anyone (probably me) want to take a look, tinkering around, or fix something in the future: above is the note that describes pretty much the whole thing.

Now let us have some rest and happy new year 2022!
