(() => {
    const widget = document.querySelector('.portfolio-chat');
    const panel = document.querySelector('#chat-panel');
    const toggle = document.querySelector('#chat-toggle');
    const input = document.querySelector('#chat-input');
    const form = document.querySelector('#chat-form');
    const messages = document.querySelector('#chat-messages');
    const status = document.querySelector('#chat-status');
    const mode = document.querySelector('#chat-mode');
    const history = [];
    let busy = false;
    let contactReady = false;
    // Mirror the server's delivery status so answers stay truthful.
    if (/^https?:$/.test(location.protocol)) {
        fetch('/api/contact/status', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(data => { contactReady = data?.configured === true; })
            .catch(() => {});
    }

    const text = (selector) => [...document.querySelectorAll(selector)]
        .map((element) => {
            const copy = element.cloneNode(true);
            copy.querySelectorAll('[aria-hidden="true"]').forEach(decoration => decoration.remove());
            copy.querySelectorAll('h3, p, li, span, a').forEach(element => element.append(' '));
            return copy.textContent.replace(/\s+/g, ' ').trim();
        }).join('\n');
    const topics = [
        { match: /\b(projects?|gym|membership|portfolio|built|build|developed)\b/i, source: '#projects', selector: '#projects .project-item' },
        { match: /\b(skills?|tools?|tech|stack|languages?|programming|java|php|mysql|html|css|code|database)\b/i, source: '#skills', selector: '.tech-tags, #skills .interest-tags' },
        { match: /\b(education|school|college|study|studies|studying|degree|course|student|university)\b/i, source: '#education', selector: '#about .about-text:first-of-type, #education .edu-details' },
        { match: /\b(hobbies|hobby|interests?|free time|games|gaming|editing|enjoy|likes?)\b/i, source: '#about', selector: '#about .about-text-gap' },
        { match: /\b(where|location|based|live|city|country)\b/i, source: '#education', selector: '.site-footer' },
        { match: /\b(who|about|introduce|yourself|himself|name|summary|background|services)\b/i, source: '#about', selector: '#about .about-text, #about .services-list' }
    ];

    function basicAnswer(question) {
        if (/^(hi|hello|hey|thanks|thank you)[!.\s]*$/i.test(question)) {
            return { answer: 'Hello! Ask me about RJ’s skills, projects, education, or interests.' };
        }
        if (/\b(contact|reach|social|facebook|github|email|hire|hiring|available|availability)\b/i.test(question)) {
            const links = [...document.querySelectorAll('#social a[href^="https:"]')].map(a => `${a.textContent}: ${a.href}`).join('\n');
            const intro = contactReady
                ? 'The fastest way is the contact form on this site — messages go straight to RJ’s inbox. You can also find him on Facebook and GitHub:\n'
                : 'You can find RJ on Facebook and GitHub:\n';
            return { answer: intro + links + '\nHis email address and work availability are not listed in this portfolio.', source: contactReady ? '#contact' : '#social' };
        }
        // Do not infer personal details that the portfolio does not provide.
        if (/\b(age|birthday|salary|phone|address|married|girlfriend|boyfriend|years|graduat|favorite)\w*\b/i.test(question)) {
            return { answer: 'That detail is not listed in RJ’s portfolio. You can reach him through his social links to ask directly.', source: '#social' };
        }
        const matches = topics.filter(topic => topic.match.test(question));
        if (!matches.length) return { answer: 'I couldn’t find that in RJ’s portfolio. Try asking about his education, skills, projects, interests, or social links.' };
        return { answer: 'From RJ’s portfolio:\n\n' + [...new Set(matches.map(topic => text(topic.selector)))].join('\n\n'), source: matches[0].source };
    }

    function addMessage(role, content, source) {
        const message = document.createElement('div');
        message.className = `chat-message chat-message-${role}`;
        const label = document.createElement('strong');
        label.textContent = role === 'user' ? 'YOU' : 'RJ’S ASSISTANT';
        const body = document.createElement('p');
        body.textContent = content;
        message.append(label, body);
        if (source) {
            const link = document.createElement('a');
            link.href = source;
            link.textContent = 'View portfolio section →';
            link.addEventListener('click', () => setOpen(false, false));
            message.append(link);
        }
        messages.append(message);
        while (messages.children.length > 60) messages.firstElementChild.remove();
        messages.scrollTop = messages.scrollHeight;
    }

    function setOpen(open, restoreFocus = true) {
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        if (open) input.focus();
        else if (restoreFocus) toggle.focus();
    }

    async function ask(question) {
        question = question.trim().slice(0, 1000);
        if (!question || busy) return;
        busy = true;
        input.value = '';
        addMessage('user', question);
        status.textContent = 'Looking through the portfolio...';
        // Keep keyboard focus in the conversation when its send/suggestion button is disabled.
        input.focus({ preventScroll: true });
        widget.querySelectorAll('button[type="submit"], .chat-suggestions button').forEach(button => button.disabled = true);
        let reply;
        try {
            if (!/^https?:$/.test(location.protocol)) throw new Error('Static mode');
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...history.slice(-10), { role: 'user', content: question }] }),
                signal: AbortSignal.timeout(25000)
            });
            if (!response.ok) throw new Error('AI unavailable');
            reply = await response.json();
            if (typeof reply.answer !== 'string' || !reply.answer.trim()) throw new Error('Empty answer');
            mode.textContent = 'AI answers · Portfolio grounded';
            status.textContent = '';
        } catch {
            reply = basicAnswer(question);
            mode.textContent = 'Basic mode · Portfolio lookup';
            status.textContent = 'AI is unavailable. Showing a local portfolio lookup.';
        } finally {
            busy = false;
            widget.querySelectorAll('button[type="submit"], .chat-suggestions button').forEach(button => button.disabled = false);
        }
        addMessage('assistant', reply.answer, reply.source);
        history.push({ role: 'user', content: question }, { role: 'assistant', content: reply.answer });
        if (history.length > 10) history.splice(0, history.length - 10);
    }

    toggle.addEventListener('click', () => setOpen(panel.hidden));
    document.querySelector('#chat-close').addEventListener('click', () => setOpen(false));
    widget.addEventListener('keydown', event => {
        if (event.key === 'Escape') setOpen(false);
    });
    form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
    document.querySelectorAll('.chat-suggestions button').forEach(button => {
        button.addEventListener('click', () => ask(button.textContent));
    });
    addMessage('assistant', 'Hi! I’m RJ’s portfolio assistant. Ask about his projects, skills, education, or interests. I use the information on this site and will say when a detail isn’t listed.');
    widget.hidden = false;
})();
