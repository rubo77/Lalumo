Homepage
========

Plan for a homepage https://lalumo.eu

## Content Requirements

The page should contain:

- **Link to App Store** (planned)
- **Link to Google Play Store** 
- **Impress** (Legal notice/Impressum)
- **Privacy Policy**

## Recommended Repository Structure

###  Keep Current Structure (Recommended)
- Keep main app as `index.html` (current setup)
- Create separate `homepage/index.html` for public landing page
- Deploy homepage/ as the main page on lalumo.eu
- Deploy the app index.html to app/ on lalumo.eu

**Advantages:**
- Clean separation between marketing site and application
- Easy to maintain open source status while hiding monetization details
- SEO-friendly landing page with proper meta tags
- Can showcase features without exposing full functionality

## Homepage Content Structure

### 1. Hero Section
```
🎵 Lalumo - Learn Music Naturally
[Subtitle: Interactive music learning through sound and play]
[Download buttons: App Store | Google Play]
```

### 2. Feature Highlights
- **Pitch Recognition**: Train your ear with interactive exercises
- **Chord Understanding**: Visual and auditory chord learning
- **Tone Colors**: Explore different instrument sounds
- **Adaptive Learning**: Personalized progress tracking

### 3. Screenshot Gallery
- Show key app screens (non-monetized activities)
- Focus on educational value and beautiful UI

### 4. Footer
- **Legal**: [Impress] | [Privacy Policy] | [Terms of Service]
- **Social**: Links to social media if applicable
- **Contact**: Support email

## Technical Implementation Strategy

### Build Process Updates
1. **Dual Build Targets**:
   - `homepage.html` - Public landing page (static)
   - `app.html` - Full application (existing index.html)

2. **Asset Management**:
   - Shared assets (logo, basic styles)
   - Separate homepage assets (marketing images, simplified CSS)

3. **SEO Optimization**:
   - Meta tags for app store optimization
   - Open Graph tags for social sharing
   - Structured data for app listings

### Privacy & Open Source Considerations

**What to Hide:**
- Specific monetization strategies
- Premium feature implementations
- Detailed analytics/tracking code
- Internal business logic

**What to Keep Open:**
- Core educational algorithms
- UI/UX components
- General app structure
- Basic functionality

## Content Creation Needs

### Copy Writing
- [ ] Hero section text (German/English)
- [ ] Feature descriptions
- [ ] App store descriptions
- [ ] Legal pages (Impressum, Privacy Policy)

### Visual Assets
- [ ] App screenshots for different devices
- [ ] Feature highlight graphics
- [ ] App store badges
- [ ] Social media preview images

### Legal Documents
- [ ] Impressum (German legal requirement)
- [ ] Privacy Policy (GDPR compliant)
- [ ] Terms of Service
- [ ] App Store compliance texts

## Deployment Strategy

1. **Homepage First**: Create and deploy static homepage
2. **App Integration**: Seamless transition from homepage to app
3. **Analytics**: Track homepage → app conversion
4. **A/B Testing**: Optimize conversion rates

## Next Steps

1. **Design Homepage Layout**: Create wireframe/mockup
2. **Write Copy**: Prepare all text content
3. **Legal Review**: Ensure all legal requirements met
4. **Technical Implementation**: Build homepage.html
5. **Testing**: Cross-browser and mobile testing
6. **Deployment**: Configure domain and hosting

---

## Notes on Open Source Strategy

The current approach allows maintaining open source status while protecting business interests:

- **Public Repository**: Core educational functionality remains visible
- **Private Business Logic**: Monetization features can be abstracted
- **Community Contributions**: Others can contribute to educational algorithms
- **Commercial Viability**: Revenue streams remain protected

This creates a win-win: educational community gets value, business remains viable.
