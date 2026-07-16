// KVKK (TR) + GDPR (EU) explicit-consent notice shown before a CV is sent.
// Full text authored for EN + TR (primary legal markets); other locales fall
// back to EN. NOTE: professional legal translation/review is recommended before
// production for all 30 locales — this is a thorough good-faith draft.
import type { LocaleCode } from './types'

export interface ConsentSection {
  heading: string
  body: string
}
export interface ConsentDoc {
  title: string
  intro: string
  sections: ConsentSection[]
  statement: string
  accept: string
  decline: string
  scrollHint: string
}

const en: ConsentDoc = {
  title: 'Data Processing & Explicit Consent',
  intro:
    'Before you send your CV, please read this notice. By submitting your CV you give explicit consent for your personal data to be processed as described below under the Turkish Personal Data Protection Law (KVKK No. 6698) and the EU General Data Protection Regulation (GDPR 2016/679).',
  sections: [
    { heading: '1. Data Controller', body: 'Metanetsoft is the data controller. For any request you can reach us at info@metanetsoft.com.' },
    { heading: '2. Data We Process', body: 'The CV file you upload and all personal data it contains (e.g. name, contact details, education, work history, skills, and anything else you include), together with the name, e-mail address and note you enter in the form, and basic technical metadata (IP address, timestamp) needed to receive and secure the submission.' },
    { heading: '3. Purposes of Processing', body: 'To evaluate your profile for freelance, seasonal, contract or project-based collaboration; to build and maintain a talent pool; to match you with current and future opportunities; to contact you about them; and to keep internal records of applications.' },
    { heading: '4. AI & Automated Processing', body: 'You expressly agree that your CV and its contents may be read, parsed, structured, classified, summarised, scored and matched by automated systems and by artificial-intelligence / large-language-model services (including third-party AI providers) in order to assess suitability and organise the talent pool. This may involve automated evaluation of your data.' },
    { heading: '5. Legal Basis', body: 'Processing is based on your explicit consent (KVKK Art. 5/1 and Art. 6/2 for any special categories of data; GDPR Art. 6(1)(a) and, where special-category data appears in your CV, Art. 9(2)(a)). You are not obliged to provide your data; you provide it and this consent voluntarily.' },
    { heading: '6. Storage, Retention & Talent Pool', body: 'Your CV and data are stored and kept in our talent pool and used for the purposes above until you withdraw your consent or until they are no longer needed for those purposes, after which they are deleted or anonymised.' },
    { heading: '7. Sharing & International Transfer', body: 'Your data may be processed within Metanetsoft and by the service providers and AI tools we use to operate the pool. Some of these providers may be located outside your country and outside Türkiye/EEA; by giving consent you also accept such international transfer for the stated purposes.' },
    { heading: '8. Your Rights', body: 'Under KVKK Art. 11 and GDPR Art. 15–22 you may request access to, rectification or erasure of your data, restriction of or objection to processing, and data portability, and you may withdraw your consent at any time by contacting info@metanetsoft.com. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.' },
    { heading: '9. Usage Grant', body: 'You agree that, for the purposes above, Metanetsoft may retain, process and use the submitted CV and its personal data (including via the AI processing described) for as long as your consent remains valid.' },
  ],
  statement:
    'I have read and understood this notice and I give my explicit consent to the processing of my CV and personal data (including automated / AI processing and international transfer) as described above.',
  accept: 'I Accept & Give Consent',
  decline: 'Cancel',
  scrollHint: 'Scroll to the end to enable the accept button.',
}

const tr: ConsentDoc = {
  title: 'Veri İşleme ve Açık Rıza',
  intro:
    'CV’nizi göndermeden önce lütfen bu metni okuyun. CV’nizi göndererek, kişisel verilerinizin aşağıda açıklandığı şekilde 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve AB Genel Veri Koruma Tüzüğü (GDPR 2016/679) kapsamında işlenmesine açık rıza vermiş olursunuz.',
  sections: [
    { heading: '1. Veri Sorumlusu', body: 'Veri sorumlusu Metanetsoft’tur. Her türlü talebiniz için info@metanetsoft.com adresinden bize ulaşabilirsiniz.' },
    { heading: '2. İşlenen Veriler', body: 'Yüklediğiniz CV dosyası ve içerdiği tüm kişisel veriler (ör. ad, iletişim bilgileri, eğitim, iş geçmişi, yetkinlikler ve eklediğiniz diğer bilgiler); formda girdiğiniz ad, e-posta adresi ve not; ve gönderimi almak ve güvenceye almak için gereken temel teknik veriler (IP adresi, zaman damgası).' },
    { heading: '3. İşleme Amaçları', body: 'Profilinizi freelance, dönemsel, sözleşmeli veya proje bazlı iş birliği için değerlendirmek; bir yetenek havuzu oluşturmak ve sürdürmek; sizi mevcut ve ileriki fırsatlarla eşleştirmek; bu konularda sizinle iletişime geçmek; ve başvuru kayıtlarını tutmak.' },
    { heading: '4. Yapay Zeka ve Otomatik İşleme', body: 'CV’nizin ve içeriğinin, uygunluk değerlendirmesi ve havuzun düzenlenmesi amacıyla otomatik sistemler ve yapay zeka / büyük dil modeli hizmetleri (üçüncü taraf YZ sağlayıcıları dahil) tarafından okunabileceğini, ayrıştırılabileceğini, yapılandırılabileceğini, sınıflandırılabileceğini, özetlenebileceğini, puanlanabileceğini ve eşleştirilebileceğini açıkça kabul edersiniz. Bu, verilerinizin otomatik olarak değerlendirilmesini içerebilir.' },
    { heading: '5. Hukuki Sebep', body: 'İşleme açık rızanıza dayanır (özel nitelikli veriler için KVKK m.5/1 ve m.6/2; GDPR m.6(1)(a) ve CV’nizde özel nitelikli veri bulunması halinde m.9(2)(a)). Verilerinizi vermek zorunda değilsiniz; verilerinizi ve bu rızayı gönüllü olarak verirsiniz.' },
    { heading: '6. Saklama, Muhafaza ve Yetenek Havuzu', body: 'CV’niz ve verileriniz, yukarıdaki amaçlarla yetenek havuzumuzda saklanır ve rızanızı geri alana ya da bu amaçlar için gerekli olmaktan çıkana kadar kullanılır; sonrasında silinir veya anonimleştirilir.' },
    { heading: '7. Paylaşım ve Yurt Dışına Aktarım', body: 'Verileriniz Metanetsoft bünyesinde ve havuzu işletmek için kullandığımız hizmet sağlayıcılar ile YZ araçları tarafından işlenebilir. Bu sağlayıcıların bir kısmı ülkenizin ve Türkiye/AEA’nın dışında bulunabilir; rıza vererek belirtilen amaçlarla bu yurt dışı aktarımı da kabul etmiş olursunuz.' },
    { heading: '8. Haklarınız', body: 'KVKK m.11 ve GDPR m.15–22 uyarınca verilerinize erişme, düzeltilmesini veya silinmesini isteme, işlemenin kısıtlanmasını veya işlemeye itiraz etme ve veri taşınabilirliği haklarına sahipsiniz ve info@metanetsoft.com adresine başvurarak rızanızı dilediğiniz zaman geri alabilirsiniz. Geri alma, öncesinde yapılan işlemenin hukuka uygunluğunu etkilemez.' },
    { heading: '9. Kullanım İzni', body: 'Yukarıdaki amaçlarla, Metanetsoft’un gönderilen CV’yi ve içindeki kişisel verileri (açıklanan YZ ile işleme dahil) rızanız geçerli olduğu sürece saklamasını, işlemesini ve kullanmasını kabul edersiniz.' },
  ],
  statement:
    'Bu metni okudum ve anladım; CV’min ve kişisel verilerimin yukarıda açıklandığı şekilde (otomatik / yapay zeka ile işleme ve yurt dışına aktarım dahil) işlenmesine açık rıza veriyorum.',
  accept: 'Kabul Ediyorum ve Rıza Veriyorum',
  decline: 'İptal',
  scrollHint: 'Kabul butonunu etkinleştirmek için sonuna kadar kaydırın.',
}

const DOCS: Partial<Record<LocaleCode, ConsentDoc>> = { en, tr }

export function getConsentDoc(locale: LocaleCode): ConsentDoc {
  return DOCS[locale] ?? en
}
